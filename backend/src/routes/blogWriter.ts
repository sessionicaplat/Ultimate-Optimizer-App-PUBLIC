import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { getAppInstance, updateDefaultWriter, updateOwnerEmail } from '../db/appInstances';
import { getInstanceToken } from '../wix/tokenHelper';
import {
  MembersClientContext,
  findMemberByEmail,
  createMemberWithProfile,
  getSiteOwnerInfo,
} from '../wix/memberHelper';
import { generateWriterEmail, normalizeWriterName } from '../utils/writer';

const router = Router();

router.get('/api/blog-writer', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const instance = await getAppInstance(instanceId);

    if (!instance) {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }

    res.json({
      writerName: instance.default_writer_name || null,
      writerEmail: instance.default_writer_email || null,
      writerMemberId: instance.default_writer_member_id || null,
      isConfigured: Boolean(instance.default_writer_member_id),
    });
  } catch (error: any) {
    console.error('[Blog Writer] Failed to load writer info:', error);
    res.status(500).json({
      error: 'Failed to load writer info',
      message: error?.message || 'Unexpected error',
    });
  }
});

router.put('/api/blog-writer', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const { writerName, writerEmail } = req.body || {};

    if (typeof writerName !== 'string' || !writerName.trim()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'writerName is required',
      });
      return;
    }

    const normalizedName = normalizeWriterName(writerName);

    if (normalizedName.length < 2) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Writer name must be at least 2 characters long',
      });
      return;
    }

    const instance = await getAppInstance(instanceId);

    if (!instance) {
      res.status(404).json({ error: 'Instance not found' });
      return;
    }

    let resolvedEmail: string;

    if (typeof writerEmail === 'string' && writerEmail.trim()) {
      resolvedEmail = writerEmail.trim().toLowerCase();
      if (!resolvedEmail.includes('@') || resolvedEmail.length > 320) {
        res.status(400).json({
          error: 'Validation failed',
          message: 'writerEmail must be a valid email address',
        });
        return;
      }
    } else {
      resolvedEmail = generateWriterEmail(normalizedName, instance.instance_id);
    }

    const token = await getInstanceToken(instanceId);
    let siteId = instance.site_id || null;

    if (!siteId) {
      const ownerInfo = await getSiteOwnerInfo(token);
      if (ownerInfo.siteId) {
        siteId = ownerInfo.siteId;
        if (ownerInfo.ownerEmail) {
          await updateOwnerEmail(instanceId, ownerInfo.ownerEmail, { siteId });
        } else if (instance.owner_email) {
          await updateOwnerEmail(instanceId, instance.owner_email, { siteId });
        }
      }
    }

    const authContext: MembersClientContext = {
      accessToken: token,
      siteId,
    };

    let memberId = instance.default_writer_member_id;

    if (instance.default_writer_email?.toLowerCase() !== resolvedEmail) {
      memberId = await findMemberByEmail(authContext, resolvedEmail);
    }

    if (!memberId) {
      memberId = await createMemberWithProfile(authContext, {
        email: resolvedEmail,
        nickname: normalizedName,
        privacyStatus: 'PUBLIC',
      });
    }

    await updateDefaultWriter(instanceId, {
      name: normalizedName,
      email: resolvedEmail,
      memberId,
    });

    res.json({
      writerName: normalizedName,
      writerEmail: resolvedEmail,
      writerMemberId: memberId,
      isConfigured: true,
    });
  } catch (error: any) {
    console.error('[Blog Writer] Failed to update writer:', error);
    const wixDetails = error?.response?.data || error?.details;
    const message =
      wixDetails?.applicationError?.description ||
      wixDetails?.applicationError?.code ||
      error?.message ||
      'Failed to configure writer';

    res.status(422).json({
      error: 'Writer configuration failed',
      message,
      details: wixDetails,
    });
  }
});

export default router;
