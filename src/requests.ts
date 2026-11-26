import { Category, Prisma, PrismaClient } from '@prisma/client';
import { Router, RequestHandler, Response } from 'express';
import { requestFilters } from './request-filters';

const users = { select: { id: true, username: true } } as const;
const people = { requester: users, reviewer: users } as const;
const categories = Object.values(Category);
const maxId = 2147483647;

function error(res: Response, status: number, code: string, message: string, fields?: Record<string, string>) {
  res.status(status).json({ error: { code, message, fields } });
}

function trimmed(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateFields(input: Record<string, unknown>) {
  const title = trimmed(input.title), justification = trimmed(input.justification);
  const category = input.category as Category;
  const amount = typeof input.amount === 'number' ? String(input.amount) : trimmed(input.amount);
  const fields: Record<string, string> = {};
  if (!title) fields.title = 'Enter a title.';
  if (!justification) fields.justification = 'Enter a justification.';
  if (!categories.includes(category)) fields.category = 'Choose a valid category.';
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
    fields.amount = 'Enter a positive THB amount with up to two decimal places.';
  }
  return { fields, data: { title, justification, category, amount } };
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
    const { fields, data: values } = validateFields(req.body ?? {});
    if (Object.keys(fields).length) {
      error(res, 400, 'INVALID_INPUT', 'Check the highlighted fields.', fields);
      return;
    }

    const requesterId: number = res.locals.user.id;
    const data = await db.request.create({
      data: {
        ...values, requesterId,
        history: { create: { actorId: requesterId, toState: 'PENDING' } },
      },
      include: people,
    });
    res.status(201).json({ data });
  });

  router.get('/', async (req, res) => {
    const { id, role } = res.locals.user;
    const { fields, where: filters, mine } = requestFilters(req.query, role);
    if (Object.keys(fields).length) {
      error(res, 400, 'INVALID_INPUT', 'Check the highlighted filters.', fields);
      return;
    }
    const where: Prisma.RequestWhereInput = { AND: [
      role === 'REQUESTER' ? { requesterId: id } : mine ? { reviewerId: id } : {},
      filters,
    ] };
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

  router.post('/:id/withdraw', requesterOnly, requireJson, async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length) {
      error(res, 400, 'INVALID_INPUT', 'Withdrawal does not accept input fields.');
      return;
    }
    const id: number = res.locals.requestId;
    const ownerId: number = res.locals.user.id;
    const result = await db.$transaction(async tx => {
      const update = await tx.request.updateMany({
        where: { id, requesterId: ownerId, state: 'PENDING', reviewerId: null },
        data: { state: 'WITHDRAWN' },
      });
      if (update.count === 1) {
        await tx.requestHistory.create({ data: {
          requestId: id, actorId: ownerId, fromState: 'PENDING', toState: 'WITHDRAWN',
          reason: 'Requester withdrew the request.',
        } });
        return { data: await tx.request.findUniqueOrThrow({ where: { id }, include: people }) };
      }
      const current = await tx.request.findFirst({ where: { id, requesterId: ownerId } });
      if (!current) return { status: 404, code: 'NOT_FOUND', message: 'Request not found.' } as const;
      return { status: 409, code: 'INVALID_TRANSITION', message: 'Only an unclaimed pending request can be withdrawn.' } as const;
    });
    if (result.data) res.json({ data: result.data });
    else error(res, result.status, result.code, result.message);
  });

  function transition(target: 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'RETURNED'): RequestHandler {
    return async (req, res) => {
      const id: number = res.locals.requestId;
      const actorId: number = res.locals.user.id;
      const claiming = target === 'IN_REVIEW';
      const from = claiming ? 'PENDING' : 'IN_REVIEW';
      const rawReason: unknown = req.body?.reason;
      const reason = claiming ? null : trimmed(rawReason) || null;
      if (!claiming && ((rawReason != null && typeof rawReason !== 'string') ||
        ((target === 'REJECTED' || target === 'RETURNED') && !reason))) {
        error(res, 400, 'INVALID_INPUT', 'Enter a valid decision reason.', { reason: 'Enter a reason.' });
        return;
      }
      const result = await db.$transaction(async (tx) => {
        const update = await tx.request.updateMany({
          where: { id, state: from, reviewerId: claiming ? null : actorId, requesterId: { not: actorId } },
          data: claiming
            ? { state: target, reviewerId: actorId }
            : { state: target, decisionReason: reason, decidedAt: target === 'RETURNED' ? null : new Date() },
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
  router.post('/:id/return', reviewerOnly, requireJson, transition('RETURNED'));

  function ownerUpdate(resubmit: boolean): RequestHandler {
    return async (req, res) => {
      const id: number = res.locals.requestId, ownerId: number = res.locals.user.id;
      const result = await db.$transaction(async tx => {
        // Both operations take the SAME owner-scoped row lock before state/read/write.
        // An edit therefore cannot commit after a concurrent resubmission.
        await tx.$queryRaw`SELECT "id" FROM "Request" WHERE "id" = ${id} AND "requesterId" = ${ownerId} FOR UPDATE`;
        const current = await tx.request.findFirst({ where: { id, requesterId: ownerId }, include: people });
        if (!current) return { status: 404, code: 'NOT_FOUND', message: 'Request not found.' };
        if (current.state !== 'RETURNED') return { status: 409, code: 'INVALID_TRANSITION', message: 'Only returned requests can be edited or resubmitted.' };
        const allowed = resubmit ? [] : ['title', 'category', 'amount', 'justification'];
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
          Object.keys(req.body).some(key => !allowed.includes(key))) {
          return { status: 400, code: 'INVALID_INPUT', message: 'Only editable request fields are allowed.' };
        }
        const { fields, data } = validateFields({
          title: current.title, category: current.category, amount: current.amount.toString(),
          justification: current.justification, ...(resubmit ? {} : req.body),
        });
        if (Object.keys(fields).length) return { status: 400, code: 'INVALID_INPUT', message: 'Check the highlighted fields.', fields };
        if (!resubmit && data.title === current.title && data.category === current.category &&
          data.justification === current.justification && new Prisma.Decimal(data.amount).equals(current.amount)) {
          return { data: current };
        }
        const saved = await tx.request.update({
          where: { id },
          data: resubmit
            ? { state: 'IN_REVIEW', decisionReason: null, decidedAt: null }
            : data,
          include: people,
        });
        await tx.requestHistory.create({ data: {
          requestId: id, actorId: ownerId, fromState: 'RETURNED',
          toState: resubmit ? 'IN_REVIEW' : 'RETURNED',
          reason: resubmit ? null : 'Request details updated.',
        } });
        return { data: saved };
      });
      if (result.data) res.json({ data: result.data });
      else error(res, result.status!, result.code!, result.message!, result.fields);
    };
  }
  router.patch('/:id', requesterOnly, requireJson, ownerUpdate(false));
  router.post('/:id/resubmit', requesterOnly, requireJson, ownerUpdate(true));
  return router;
}
