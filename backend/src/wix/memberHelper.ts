/**
 * Helper functions for managing Wix Site Members
 * 
 * Key Distinction:
 * - Wix User (Site Owner) = Has email, manages site
 * - Site Member = Registered member on the site, has memberId
 * 
 * Site owners are NOT automatically site members.
 * We need to query/create a member record using their email.
 */

import { createClient, ApiKeyStrategy } from '@wix/sdk';
import { members } from '@wix/members';

function formatBearer(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

export interface MembersClientContext {
  accessToken?: string;
  siteId?: string | null;
}

export interface SiteOwnerInfo {
  ownerEmail: string | null;
  siteId: string | null;
}

function getMembersApiKey(): string | null {
  return process.env.WIX_MEMBERS_API_KEY || process.env.WIX_API_KEY || null;
}

function createMembersClient(context: MembersClientContext) {
  const apiKey = getMembersApiKey();

  if (apiKey) {
    if (context.siteId) {
      console.log(
        `[memberHelper] Using ApiKeyStrategy for siteId ${context.siteId}`
      );
      return createClient({
        auth: ApiKeyStrategy({
          apiKey,
          siteId: context.siteId,
        }),
        modules: {
          members,
        },
      });
    }

    console.warn(
      '[memberHelper] WIX_MEMBERS_API_KEY is set but siteId is missing; falling back to access token auth'
    );
  }

  if (!context.accessToken) {
    throw new Error(
      'Members API client requires either WIX_MEMBERS_API_KEY + siteId or an access token'
    );
  }

  return createClient({
    auth: {
      getAuthHeaders: () => ({
        headers: {
          Authorization: formatBearer(context.accessToken!),
        },
      }),
    },
    modules: {
      members,
    },
  });
}

/**
 * Get site owner's metadata (email + siteId) using App Management API
 * Requires "Read Site Owner Email" permission scope for email access
 */
export async function getSiteOwnerInfo(accessToken: string): Promise<SiteOwnerInfo> {
  try {
    const response = await fetch('https://www.wixapis.com/apps/v1/instance', {
      method: 'GET',
      headers: {
        Authorization: formatBearer(accessToken),
      },
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('[memberHelper] Failed to fetch app instance info:', details);
      return { ownerEmail: null, siteId: null };
    }

    const instanceResponse = (await response.json()) as any;
    const ownerEmail =
      instanceResponse?.site?.ownerInfo?.email ||
      instanceResponse?.site?.ownerEmail ||
      null;
    const siteId = instanceResponse?.site?.siteId || null;

    if (!ownerEmail) {
      console.warn('[memberHelper] No owner email found in app instance response');
    }

    if (!siteId) {
      console.warn('[memberHelper] No siteId found in app instance response');
    }

    if (ownerEmail || siteId) {
      console.log(
        `[memberHelper] Retrieved owner info: email=${ownerEmail ?? 'n/a'}, siteId=${
          siteId ?? 'n/a'
        }`
      );
    }

    return { ownerEmail, siteId };
  } catch (error: any) {
    console.error('[memberHelper] Error getting site owner info:', error.message || error);
    return { ownerEmail: null, siteId: null };
  }
}

/**
 * Backwards-compatible helper for callers who only need the owner email
 */
export async function getSiteOwnerEmail(accessToken: string): Promise<string | null> {
  const info = await getSiteOwnerInfo(accessToken);
  return info.ownerEmail;
}

/**
 * Find a site member by their email address
 * Returns the member's ID if found, null otherwise
 */
export async function findMemberByEmail(
  authContext: MembersClientContext,
  email: string
): Promise<string | null> {
  try {
    const client = createMembersClient(authContext);

    console.log(`[memberHelper] Querying for member with email: ${email}`);
    
    const { items } = await client.members
      .queryMembers()
      .eq('loginEmail', email)
      .find();

    if (items && items.length > 0) {
      const memberId = items[0]._id;
      console.log(`[memberHelper] Found existing member: ${memberId}`);
      return memberId || null;
    }

    console.log(`[memberHelper] No member found with email: ${email}`);
    return null;
  } catch (error: any) {
    console.error('[memberHelper] Error finding member by email:', error.message || error);
    return null;
  }
}

/**
 * Create a new site member for the site owner
 * Returns the new member's ID
 */
interface CreateMemberOptions {
  email: string;
  nickname?: string;
  privacyStatus?: 'PRIVATE' | 'PUBLIC';
}

export async function createMemberWithProfile(
  authContext: MembersClientContext,
  options: CreateMemberOptions
): Promise<string> {
  const client = createMembersClient(authContext);
  const nickname = options.nickname?.trim();

  console.log(
    `[memberHelper] Creating member for email: ${options.email}${
      nickname ? ` (display name: ${nickname})` : ''
    }`
  );

  const memberOptions = {
    member: {
      loginEmail: options.email,
      privacyStatus: options.privacyStatus ?? ('PUBLIC' as const),
      profile: nickname
        ? {
            nickname,
            displayName: nickname,
          }
        : undefined,
    },
  };

  try {
    const newMember = await client.members.createMember(memberOptions);
    const memberId = (newMember as any)?._id || (newMember as any)?.member?._id;

    if (!memberId) {
      throw new Error('Member created but no ID returned');
    }

    console.log(`[memberHelper] Created new member: ${memberId}`);
    return memberId;
  } catch (error: any) {
    console.error(
      '[memberHelper] Error creating member:',
      error.response?.data || error.message || error
    );
    throw error;
  }
}

export async function createMemberForOwner(
  authContext: MembersClientContext,
  email: string
): Promise<string | null> {
  try {
    return await createMemberWithProfile(authContext, {
      email,
      privacyStatus: 'PRIVATE',
    });
  } catch {
    return null;
  }
}

export async function getOrCreateMemberIdByEmail(
  authContext: MembersClientContext,
  email: string,
  options?: {
    nickname?: string;
    privacyStatus?: 'PRIVATE' | 'PUBLIC';
  }
): Promise<string | null> {
  try {
    const siteContext = authContext.siteId ? ` (siteId: ${authContext.siteId})` : '';
    console.log(
      `[memberHelper] Resolving member by email ${email}${siteContext}`
    );

    let memberId = await findMemberByEmail(authContext, email);

    if (memberId) {
      console.log(`[memberHelper] Using existing member ID: ${memberId}`);
      return memberId;
    }

    memberId = await createMemberWithProfile(authContext, {
      email,
      nickname: options?.nickname,
      privacyStatus: options?.privacyStatus,
    });

    return memberId;
  } catch (error: any) {
    console.error(
      '[memberHelper] Error in getOrCreateMemberIdByEmail:',
      error.response?.data || error.message || error
    );
    return null;
  }
}

/**
 * Get or create a site member ID for the site owner
 * 
 * This is the main function to use when you need a member ID for blog posts.
 * It will:
 * 1. Try to find an existing member with the owner's email
 * 2. If not found, create a new member
 * 3. Return the member ID
 * 
 * @param accessToken - App-level access token with proper permissions
 * @param ownerEmail - Site owner's email address
 * @returns Member ID or null if failed
 */
export async function getOrCreateOwnerMemberId(
  authContext: MembersClientContext,
  ownerEmail: string
): Promise<string | null> {
  return getOrCreateMemberIdByEmail(authContext, ownerEmail, {
    privacyStatus: 'PRIVATE',
  });
}
