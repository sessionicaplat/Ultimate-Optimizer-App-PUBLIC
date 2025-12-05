import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Decoded Wix instance token payload
 */
export interface InstancePayload {
  instanceId: string;
  siteHost: string;
  appDefId: string;
}

/**
 * Extend Express Request to include Wix instance data
 */
declare global {
  namespace Express {
    interface Request {
      wixInstance?: InstancePayload;
    }
  }
}

/**
 * Verify Wix instance token signature using HMAC-SHA256
 * 
 * The instance token format is: <signature>.<base64_payload>
 * The signature is HMAC-SHA256(payload, app_secret)
 * 
 * Note: Wix format is signature.payload (not payload.signature)
 */
export function verifyWixSignature(instanceToken: string, appSecret: string): InstancePayload {
  const parts = instanceToken.split('.');
  
  if (parts.length !== 2) {
    throw new Error('Invalid instance token format');
  }

  // Wix format: signature.payload (first part is signature, second is payload)
  const [signature, payloadBase64] = parts;

  // Compute expected signature using HMAC-SHA256
  // Wix uses base64url encoding for the signature
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payloadBase64)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (signature !== expectedSignature) {
    throw new Error('Invalid instance token signature');
  }

  // Decode payload from base64
  const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
  const payload = JSON.parse(payloadJson);

  // Extract required fields
  if (!payload.instanceId) {
    throw new Error('Missing instanceId in token payload');
  }

  return {
    instanceId: payload.instanceId,
    siteHost: payload.siteHost || '',
    appDefId: payload.appDefId || '',
  };
}

/**
 * Express middleware to verify Wix instance token
 * 
 * Expects the token in the X-Wix-Instance header
 * Attaches decoded instance data to req.wixInstance
 */
export async function verifyInstance(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const instanceToken = req.headers['x-wix-instance'] as string;

  logger.trace('[verifyInstance] Request:', req.path);

  if (!instanceToken) {
    logger.error('[verifyInstance] Missing instance token');
    res.status(401).json({ 
      error: 'Unauthorized',
      code: 'AUTH_FAILED',
      message: 'Missing instance token' 
    });
    return;
  }

  const appSecret = process.env.WIX_APP_SECRET;
  
  if (!appSecret) {
    logger.error('[verifyInstance] WIX_APP_SECRET not configured');
    res.status(500).json({ 
      error: 'Server configuration error',
      code: 'CONFIG_ERROR',
      message: 'WIX_APP_SECRET not configured'
    });
    return;
  }

  try {
    const payload = verifyWixSignature(instanceToken, appSecret);
    logger.trace('[verifyInstance] Verified:', payload.instanceId);
    req.wixInstance = payload;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[verifyInstance] Verification failed:', errorMessage);
    res.status(401).json({ 
      error: 'Unauthorized',
      code: 'AUTH_FAILED',
      message: 'Invalid instance token',
      details: errorMessage
    });
  }
}
