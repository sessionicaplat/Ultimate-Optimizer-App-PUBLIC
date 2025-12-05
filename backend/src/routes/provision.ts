import { Router, Request, Response } from 'express';
import { verifyInstance } from '../auth/verifyInstance';
import { upsertAppInstance } from '../db/appInstances';

const router = Router();

/**
 * POST /api/provision
 * Provision the app instance by exchanging instance token for access tokens
 * This is called automatically when the app is first accessed
 */
router.post('/api/provision', verifyInstance, async (req: Request, res: Response) => {
  try {
    const { instanceId } = req.wixInstance!;
    const instanceToken = req.headers['x-wix-instance'] as string;

    const appId = process.env.WIX_APP_ID;
    const appSecret = process.env.WIX_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'WIX_APP_ID and WIX_APP_SECRET must be configured'
      });
    }

    // 2025 Flow: Use client_credentials grant with instanceId to get app-level access token
    console.log(`Provisioning dashboard app instance: ${instanceId}`);
    
    try {
      const tokenResponse = await fetch('https://www.wixapis.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: appId,
          client_secret: appSecret,
          instanceId: instanceId,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token elevation failed:', tokenResponse.status, errorText);
        return res.status(502).json({
          error: 'Token elevation failed',
          message: 'Failed to get app access token from Wix',
          details: errorText
        });
      }

      const tokenData = await tokenResponse.json() as {
        access_token: string;
        expires_in?: number;
      };

      let ownerInfo: { ownerEmail: string | null; siteId: string | null } | null = null;
      try {
        const { getSiteOwnerInfo } = await import('../wix/memberHelper');
        ownerInfo = await getSiteOwnerInfo(tokenData.access_token);
      } catch (error) {
        console.warn('Failed to fetch owner info from Wix:', error);
      }

      // Store the elevated access token
      await upsertAppInstance({
        instanceId,
        siteHost: req.wixInstance!.siteHost || '',
        siteId: ownerInfo?.siteId ?? null,
        accessToken: tokenData.access_token,
        refreshToken: instanceToken, // Store instance token for re-elevation
        expiresIn: tokenData.expires_in || 3600,
      });

      // Store owner metadata when available (needed for blog posts)
      if (ownerInfo?.ownerEmail) {
        const { updateOwnerEmail } = await import('../db/appInstances');
        await updateOwnerEmail(instanceId, ownerInfo.ownerEmail, {
          siteId: ownerInfo.siteId ?? undefined,
        });
        console.log(
          `[Provision] Stored owner email ${ownerInfo.ownerEmail}${ownerInfo.siteId ? ` (siteId: ${ownerInfo.siteId})` : ''}`
        );
      } else {
        console.warn(
          'Could not retrieve owner email - blog generation may not work until Wix permissions include "Read Site Owner Email"'
        );
      }

      // Note: Instance already has correct credits from upsertAppInstance
      // No need to sync - credits are set correctly on creation (200 for free plan)
      console.log('Instance provisioned with default credits');

      res.json({
        success: true,
        message: 'Dashboard app instance provisioned with elevated token'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Token elevation error:', errorMessage);
      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Provision error:', errorMessage);
    
    res.status(500).json({
      error: 'Provision failed',
      message: 'Failed to provision app instance',
      details: errorMessage
    });
  }
});

export default router;
