import { Category, Prisma, RequestState } from '@prisma/client';

const allowed = new Set(['state', 'category', 'from', 'to', 'q', 'mine']);

// Parse only scalar, supported parameters. Ownership is added by the route,
// independently of these narrowing filters; no query value supplies an owner.
export function requestFilters(query: Record<string, unknown>, role: 'REQUESTER' | 'REVIEWER') {
  const fields: Record<string, string> = Object.create(null);
  const values: Record<string, string> = Object.create(null);
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.has(key)) fields[key] = 'Unsupported filter.';
    else if (typeof value !== 'string') fields[key] = 'Supply this filter once as text.';
    else values[key] = value;
  }
  const where: Prisma.RequestWhereInput = {};
  if (values.state !== undefined) {
    if (!Object.values(RequestState).includes(values.state as RequestState)) fields.state = 'Choose a valid state.';
    else where.state = values.state as RequestState;
  }
  if (values.category !== undefined) {
    if (!Object.values(Category).includes(values.category as Category)) fields.category = 'Choose a valid category.';
    else where.category = values.category as Category;
  }
  if ('mine' in query) {
    if (role !== 'REVIEWER') fields.mine = 'Mine is available only to reviewers.';
    else if (values.mine !== undefined && !['true', 'false'].includes(values.mine)) fields.mine = 'Use true or false.';
  }
  function day(key: 'from' | 'to') {
    const value = values[key];
    if (value === undefined) return undefined;
    const date = new Date(value + 'T00:00:00.000Z');
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith('0000') ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      fields[key] = 'Enter a valid calendar date (YYYY-MM-DD).';
      return undefined;
    }
    return date;
  }
  const from = day('from'), to = day('to');
  if (from && to && from > to) fields.to = 'End date must be on or after start date.';
  if (from || to) where.createdAt = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lt: new Date(to.getTime() + 86_400_000) } : {}),
  };
  const q = values.q?.trim() ?? '';
  if ([...q].length > 200) fields.q = 'Use at most 200 Unicode characters.';
  else if (q) {
    // Prisma's PostgreSQL contains uses LIKE patterns. Escape the escape character
    // and both wildcard characters so the public contract is literal substring.
    const literal = q.replace(/[\\%_]/g, char => '\\' + char);
    where.OR = [
      { title: { contains: literal, mode: 'insensitive' } },
      { justification: { contains: literal, mode: 'insensitive' } },
    ];
  }
  return { fields, where, mine: values.mine === 'true' };
}
