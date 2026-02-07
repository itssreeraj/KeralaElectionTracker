export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LOGIN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [LOGIN_ERROR] ${message}`, error ? JSON.stringify(error, null, 2) : '');
  },
};

export async function POST(req: Request) {
  const startTime = Date.now();
  logger.log('Login request received', {
    method: req.method,
    url: req.url,
    contentType: req.headers.get('content-type'),
    nodeEnv: process.env.NODE_ENV,
  });

  try {
    const { username, password } = await req.json();
    const envAdminUser = process.env.ADMIN_USER;
    const envAdminPass = process.env.ADMIN_PASS;

    logger.log('Login credentials received', { username: username || 'unknown' });
    
    // Debug: Log environment configuration for credentials
    logger.log('Environment credentials config', {
      adminUserConfigured: !!envAdminUser,
      adminUserLength: envAdminUser?.length || 0,
      adminPassConfigured: !!envAdminPass,
      adminPassLength: envAdminPass?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    });

    // Debug: Log incoming credentials and comparison
    logger.log('Credential comparison details', {
      incomingUsername: username,
      expectedUsername: envAdminUser,
      usernameMatch: username === envAdminUser,
      usernameMismatchReason: username === envAdminUser ? 'OK' : `incoming="${username}" vs expected="${envAdminUser}"`,
      incomingPasswordLength: password?.length || 0,
      expectedPasswordLength: envAdminPass?.length || 0,
      passwordMatch: password === envAdminPass,
      passwordMismatchDetails: password === envAdminPass ? 'OK' : `lengths: ${password?.length}vs${envAdminPass?.length}`,
    });

    if (
      username !== envAdminUser ||
      password !== envAdminPass
    ) {
      logger.log('Invalid credentials provided', { 
        username, 
        usernameMatches: username === envAdminUser,
        passwordMatches: password === envAdminPass,
        timestamp: new Date().toISOString() 
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    logger.log('Credentials validated successfully', { username });

    const payload = {
      sub: username,
      role: "ADMIN",
      iss: "next-admin-ui",
      aud: "spring-api",
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured in environment');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const token = jwt.sign(payload, jwtSecret, {
      algorithm: "HS256",
      expiresIn: "12h",
    });
    logger.log('JWT token created', { username, expiresIn: '12h' });

    const res = NextResponse.json({ success: true });

    res.cookies.set("ADMIN_TOKEN", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 12 * 60 * 60, // 12 hours
    });

    const duration = Date.now() - startTime;
    logger.log('Login successful - cookie set', { username, duration: `${duration}ms` });
    
    return res;
  } catch (error) {
    logger.error('Login request failed', {
      error: error instanceof Error ? error.message : String(error),
      duration: `${Date.now() - startTime}ms`,
    });
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
