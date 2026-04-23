import type { Request, Response, NextFunction } from 'express'
import { logWarning, logInformation } from '../lib/logger.js'

const API_KEY = process.env.API_KEY

/**
 * Middleware to require API key authentication
 * Returns 401 if X-API-Key header is missing or invalid
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // Skip health endpoint (needs to be accessible for monitoring)
  if (req.path === '/api/health') {
    next()
    return
  }

  const providedKey = req.headers['x-api-key'] as string | undefined

  if (!providedKey) {
    logWarning('API request missing API key', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing X-API-Key header',
      },
    })
    return
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(providedKey, API_KEY || '')) {
    logWarning('API request with invalid API key', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    })
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key',
      },
    })
    return
  }

  logInformation('API authenticated request', {
    path: req.path,
    method: req.method,
  })
  next()
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}