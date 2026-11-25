import { PrismaClient } from '@prisma/client';
import { RequestHandler, Router } from 'express';

type Summary = {
  total: number;
  byState: { state: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byReviewer: { reviewer: { id: number; username: string }; approved: number; rejected: number; total: number }[];
  unattributedDecisions: number;
};

export function reportRoutes(db: PrismaClient, authenticate: RequestHandler, reviewerOnly: RequestHandler) {
  const router = Router();
  router.use(authenticate, reviewerOnly);
  router.get('/summary', async (req, res) => {
    if (Object.keys(req.query).length) {
      res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'This global report does not accept filters.' } });
      return;
    }
    // One statement means one PostgreSQL MVCC snapshot for ALL totals, including
    // final attribution, even when another transaction decides a request.
    const rows = await db.$queryRaw<{ data: Summary }[]>`
      WITH current_requests AS MATERIALIZED (
        SELECT "id", "state", "category" FROM "Request"
      ), terminal_actors AS (
        SELECT r."id", r."state", actor."id" AS actor_id, actor."username"
        FROM current_requests r
        LEFT JOIN LATERAL (
          SELECT h."actorId"
          FROM "RequestHistory" h
          WHERE h."requestId" = r."id" AND h."toState" = r."state"
            AND h."fromState" IS DISTINCT FROM h."toState"
          ORDER BY h."createdAt" DESC, h."id" DESC
          LIMIT 1
        ) decision ON true
        LEFT JOIN "User" actor ON actor."id" = decision."actorId" AND actor."role" = 'REVIEWER'
        WHERE r."state" IN ('APPROVED', 'REJECTED')
      )
      SELECT json_build_object(
        'total', (SELECT count(*)::int FROM current_requests),
        'byState', (
          SELECT json_agg(json_build_object(
            'state', bucket.state,
            'count', (SELECT count(*)::int FROM current_requests r WHERE r."state" = bucket.state)
          ) ORDER BY bucket.position)
          FROM unnest(enum_range(NULL::"RequestState")) WITH ORDINALITY bucket(state, position)
        ),
        'byCategory', (
          SELECT json_agg(json_build_object(
            'category', bucket.category,
            'count', (SELECT count(*)::int FROM current_requests r WHERE r."category" = bucket.category)
          ) ORDER BY bucket.position)
          FROM unnest(enum_range(NULL::"Category")) WITH ORDINALITY bucket(category, position)
        ),
        'byReviewer', (
          SELECT COALESCE(json_agg(json_build_object(
            'reviewer', json_build_object('id', totals.actor_id, 'username', totals."username"),
            'approved', totals.approved, 'rejected', totals.rejected, 'total', totals.total
          ) ORDER BY totals.actor_id), '[]'::json)
          FROM (
            SELECT actor_id, "username",
              (count(*) FILTER (WHERE "state" = 'APPROVED'))::int AS approved,
              (count(*) FILTER (WHERE "state" = 'REJECTED'))::int AS rejected,
              count(*)::int AS total
            FROM terminal_actors WHERE actor_id IS NOT NULL
            GROUP BY actor_id, "username"
          ) totals
        ),
        'unattributedDecisions', (SELECT count(*)::int FROM terminal_actors WHERE actor_id IS NULL)
      ) AS data
    `;
    res.json({ data: rows[0].data });
  });
  return router;
}
