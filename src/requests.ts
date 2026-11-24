import { Category, Prisma, PrismaClient, RequestState } from '@prisma/client';
import { Router, RequestHandler, Response } from 'express';

const users = { select: { id: true, username: true } } as const;
const people = { requester: users, reviewer: users } as const;
const categories = Object.values(Category);
const states = Object.values(RequestState);
const maxId = 2147483647;

function error(res: Response, status: number, code: string, message: string, fields?: Record<string, string>) {
  res.status(status).json({ error: { code, message, fields } });
}

function trimmed(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function requestRoutes(db: PrismaClient, authenticate: RequestHandler, requireJson: RequestHandler, requesterOnly: RequestHandler, reviewerOnly: RequestHandler) {
  const router = Router();
  router.use(authenticate);
  router.param('id', (_req, res, next, value: string) => {
    const id = Number(value);
    if (!/^[1-9]\d*$/.test(value) || id > maxId) {
      error(res, 404, 'NOT_FOUND', 'Request not found.');
      return;
    }
    res.locals.requestId = id;
    next();
  });

  router.post('/', requesterOnly, requireJson, async (req, res) => {
    const title = trimmed(req.body?.title);
    const justification = trimmed(req.body?.justification);
    const category = req.body?.category as Category;
    const rawAmount: unknown = req.body?.amount;
    const amount = typeof rawAmount === 'number' ? String(rawAmount) : trimmed(rawAmount);
    const fields: Record<string, string> = {};
    if (!title) fields.title = 'Enter a title.';
    if (!justification) fields.justification = 'Enter a justification.';
    if (!categories.includes(category)) fields.category = 'Choose a valid category.';
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
      fields.amount = 'Enter a positive THB amount with up to two decimal places.';
    }
    if (Object.keys(fields).length) {
      error(res, 400, 'INVALID_INPUT', 'Check the highlighted fields.', fields);
      return;
    }

    const requesterId: number = res.locals.user.id;
    const data = await db.request.create({
      data: {
        title, justification, category, amount, requesterId,
        history: { create: { actorId: requesterId, toState: 'PENDING' } },
      },
      include: people,
    });
    res.status(201).json({ data });
  });

  router.get('/', async (req, res) => {
    const { id, role } = res.locals.user;
    const where: Prisma.RequestWhereInput = {};
    if (role === 'REQUESTER') where.requesterId = id;
    if (role === 'REVIEWER') {
      const state = req.query.state as RequestState | undefined;
      if (state !== undefined && !states.includes(state)) {
        error(res, 400, 'INVALID_INPUT', 'Choose a valid state.');
        return;
      }
      where.state = state;
      if (req.query.mine === 'true') where.reviewerId = id;
    }
    const data = await db.request.findMany({ where, include: people, orderBy: { id: 'desc' } });
    res.json({ data });
  });

  router.get('/:id', async (_req, res) => {
    const { id, role } = res.locals.user;
    const data = await db.request.findFirst({
      where: { id: res.locals.requestId, requesterId: role === 'REQUESTER' ? id : undefined },
      include: people,
    });
    if (!data) {
      error(res, 404, 'NOT_FOUND', 'Request not found.');
      return;
    }
    res.json({ data });
  });

  router.get('/:id/history', async (_req, res) => {
    const { id, role } = res.locals.user;
    // Use the detail visibility rule before reading any private audit rows.
    const accessible = await db.request.findFirst({
      where: { id: res.locals.requestId, requesterId: role === 'REQUESTER' ? id : undefined },
      select: { id: true },
    });
    if (!accessible) {
      error(res, 404, 'NOT_FOUND', 'Request not found.');
      return;
    }
    const data = await db.requestHistory.findMany({
      where: { requestId: accessible.id },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true, fromState: true, toState: true, reason: true, createdAt: true,
        actor: { select: { id: true, username: true, role: true } },
      },
    });
    res.json({ data });
  });

  function transition(target: 'IN_REVIEW' | 'APPROVED' | 'REJECTED'): RequestHandler {
    return async (req, res) => {
      const id: number = res.locals.requestId;
      const actorId: number = res.locals.user.id;
      const claiming = target === 'IN_REVIEW';
      const from = claiming ? 'PENDING' : 'IN_REVIEW';
      const rawReason: unknown = req.body?.reason;
      const reason = claiming ? null : trimmed(rawReason) || null;
      if (!claiming && ((rawReason != null && typeof rawReason !== 'string') || (target === 'REJECTED' && !reason))) {
        error(res, 400, 'INVALID_INPUT', 'Enter a valid decision reason.', { reason: 'Enter a reason.' });
        return;
      }
      const result = await db.$transaction(async (tx) => {
        const update = await tx.request.updateMany({
          where: { id, state: from, reviewerId: claiming ? null : actorId, requesterId: { not: actorId } },
          data: claiming
            ? { state: target, reviewerId: actorId }
            : { state: target, decisionReason: reason, decidedAt: new Date() },
        });
        if (update.count === 1) {
          await tx.requestHistory.create({
            data: { requestId: id, actorId, fromState: from, toState: target, reason },
          });
          return { data: await tx.request.findUniqueOrThrow({ where: { id }, include: people }) };
        }
        const current = await tx.request.findUnique({ where: { id } });
        if (!current) return { status: 404, code: 'NOT_FOUND', message: 'Request not found.' } as const;
        if (current.requesterId === actorId || (!claiming && current.reviewerId !== actorId)) {
          return { status: 403, code: 'FORBIDDEN', message: 'This operation is forbidden.' } as const;
        }
        return { status: 409, code: 'INVALID_TRANSITION', message: 'The request state no longer permits this operation.' } as const;
      });
      if (result.data) {
        res.json({ data: result.data });
        return;
      }
      error(res, result.status, result.code, result.message);
    };
  }

  router.post('/:id/claim', reviewerOnly, requireJson, transition('IN_REVIEW'));
  router.post('/:id/approve', reviewerOnly, requireJson, transition('APPROVED'));
  router.post('/:id/reject', reviewerOnly, requireJson, transition('REJECTED'));
  return router;
}
