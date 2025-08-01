import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface AuthContext {
  user: User;
  userId: string;
}

/**
 * Authentication middleware for API routes
 * Validates user session and returns user context if authenticated
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, auth: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Valid authentication required' },
        { status: 401 }
      );
    }

    const authContext: AuthContext = {
      user,
      userId: user.id
    };

    return await handler(req, authContext);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

/**
 * Optional authentication middleware for API routes
 * Provides user context if authenticated, but allows unauthenticated access
 */
export async function withOptionalAuth(
  req: NextRequest,
  handler: (req: NextRequest, auth?: AuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let authContext: AuthContext | undefined;
    if (!authError && user) {
      authContext = {
        user,
        userId: user.id
      };
    }

    return await handler(req, authContext);
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue without auth context if there's an error
    return await handler(req);
  }
}

/**
 * Rate limiting store (in-memory for simplicity, use Redis in production)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return function(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const key = `rate_limit:${clientIp}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      // Reset the rate limit window
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return handler(req);
    }
    
    if (record.count >= maxRequests) {
      return Promise.resolve(NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      ));
    }
    
    record.count++;
    return handler(req);
  };
}

/**
 * Input validation helpers
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
}

export function validateRequired(fields: Record<string, any>): string[] {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    }
  }
  
  return missing;
} 