import { randomBytes } from 'node:crypto';
import { PrismaClient, Role } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express, { ErrorRequestHandler, RequestHandler, Response } from 'express';

import { requestRoutes } from './requests';
import { reportRoutes } from './reports';

const cookieName = 'session';
const publicUser = { id: true, username: true, role: true } as const;

function fail(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

export const requireRole = (role: Role): RequestHandler => (_req, res, next) => {
  if (res.locals.user?.role !== role) {
    fail(res, 403, 'FORBIDDEN', 'This operation is forbidden.');
    return;
  }
  next();
};

export function createApp(db: PrismaClient, ttlHours = 8, bcryptRounds = 12) {
  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    throw new Error('SESSION_TTL_HOURS must be positive.');
  }
  if (!Number.isInteger(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be an integer from 10 to 15.');
  }

  const app = express();
  const ttl = ttlHours * 60 * 60 * 1000;
  const dummyHash = hash(randomBytes(32).toString('hex'), bcryptRounds);
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  app.disable('x-powered-by');
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json());
  app.use(cookieParser());

  const requireJson: RequestHandler = (req, res, next) => {
    if (!req.is('application/json')) {
      fail(res, 415, 'JSON_REQUIRED', 'Send an application/json body.');
      return;
    }
    next();
  };

  const authenticate: RequestHandler = async (req, res, next) => {
    const id: unknown = req.cookies[cookieName];
    if (typeof id === 'string' && /^[a-f0-9]{64}$/.test(id)) {
      const session = await db.session.findUnique({
        where: { id },
        include: { user: { select: publicUser } },
      });
      if (session && session.expiresAt > new Date()) {
        res.locals.user = session.user;
        res.locals.sessionId = id;
        next();
        return;
      }
      if (session) await db.session.deleteMany({ where: { id } });
    }
    fail(res, 401, 'UNAUTHENTICATED', 'Log in to continue.');
  };

  app.get('/api/version', (_req, res) => {
    res.json({ data: { commit: process.env.RELEASE_COMMIT ?? 'local' } });
  });

  app.get('/api/health', async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ data: { status: 'ok' } });
    } catch {
      fail(res, 503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.');
    }
  });

  app.post('/api/auth/login', requireJson, async (req, res) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || !username.trim() || username.length > 255 ||
        typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
      fail(res, 400, 'INVALID_INPUT', 'Enter a valid username and password.');
      return;
    }

    const account = await db.user.findUnique({ where: { username: username.trim() } });
    const valid = await compare(password, account?.passwordHash ?? await dummyHash);
    if (!valid || !account) {
      fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password.');
      return;
    }

    const { id, username: accountName, role } = account;
    const sessionId = randomBytes(32).toString('hex');
    await db.session.create({
      data: { id: sessionId, userId: id, expiresAt: new Date(Date.now() + ttl) },
    });
    res.cookie(cookieName, sessionId, { ...cookieOptions, maxAge: ttl });
    res.json({ data: { id, username: accountName, role } });
  });

  app.get('/api/auth/me', authenticate, (_req, res) => {
    res.json({ data: res.locals.user });
  });

  app.post('/api/auth/logout', requireJson, authenticate, async (_req, res) => {
    await db.session.deleteMany({ where: { id: res.locals.sessionId } });
    res.clearCookie(cookieName, cookieOptions).json({ data: { loggedOut: true } });
  });

  app.use('/api/requests', requestRoutes(db, authenticate, requireJson, requireRole('REQUESTER'), requireRole('REVIEWER')));
  app.use('/api/reports', reportRoutes(db, authenticate, requireRole('REVIEWER')));

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    if (error.type === 'entity.parse.failed') {
      fail(res, 400, 'INVALID_JSON', 'The JSON body is invalid.');
      return;
    }
    if (error.type === 'entity.too.large') {
      fail(res, 413, 'BODY_TOO_LARGE', 'The request body is too large.');
      return;
    }
    console.error('Unexpected API error', error.name);
    fail(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  };
  app.use(handleError);

  return app;
}
