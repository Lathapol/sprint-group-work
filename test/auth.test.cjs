const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { test } = require('node:test');
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../dist/app');

test('public version reports the release commit without database access', async (t) => {
  const previous = process.env.RELEASE_COMMIT;
  t.after(() => {
    if (previous === undefined) delete process.env.RELEASE_COMMIT;
    else process.env.RELEASE_COMMIT = previous;
  });
  const api = request(createApp({}, 8, 10));
  process.env.RELEASE_COMMIT = 'a'.repeat(40);
  const version = await api.get('/api/version').expect(200);
  assert.equal(version.body.data.commit, 'a'.repeat(40));
});

test('login, current user, session expiry and logout against PostgreSQL', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to a migrated test database.');
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  const users = [];
  t.after(async () => {
    try {
      await db.session.deleteMany({ where: { userId: { in: users } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
    } finally {
      await db.$disconnect();
    }
  });

  const api = request(createApp(db, 8, 10));
  const password = randomUUID();
  const passwordHash = await hash(password, 10);
  await api.get('/api/auth/me').expect(401);
  await api.post('/api/auth/login').type('form').send({ username: 'unused', password }).expect(415);

  for (const role of ['REQUESTER', 'REVIEWER']) {
    const username = randomUUID();
    const { id } = await db.user.create({ data: { username, passwordHash, role } });
    users.push(id);
    const invalid = await api.post('/api/auth/login').send({ username, password: 'wrong' }).expect(401);
    const unknown = await api.post('/api/auth/login').send({ username: randomUUID(), password }).expect(401);
    assert.deepEqual(invalid.body, unknown.body);
    assert.equal(await db.session.count({ where: { userId: id } }), 0);

    const login = await api.post('/api/auth/login').send({ username, password, role: 'REVIEWER' }).expect(200);
    assert.deepEqual(login.body, { data: { id, username, role } });
    const [setCookie] = login.headers['set-cookie'];
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Lax/);
    const cookie = setCookie.split(';')[0];
    await api.get('/api/auth/me').set('Cookie', cookie).expect(200, login.body);
    const logout = await api.post('/api/auth/logout').set('Cookie', cookie).send({}).expect(200);
    assert.match(logout.headers['set-cookie'][0], /^session=;/);
    await api.get('/api/auth/me').set('Cookie', cookie).expect(401);
    assert.equal(await db.session.count({ where: { userId: id } }), 0);

    const expired = await db.session.create({
      data: { id: 'a'.repeat(64), userId: id, expiresAt: new Date(0) },
    });
    await api.get('/api/auth/me').set('Cookie', 'session=' + expired.id).expect(401);
    assert.equal(await db.session.findUnique({ where: { id: expired.id } }), null);
  }
});

test('health reports database readiness without exposing database errors', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to a migrated test database.');
  const db = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
  t.after(() => db.$disconnect());
  await request(createApp(db, 8, 10)).get('/api/health').expect(200, { data: { status: 'ok' } });

  const unavailable = { $queryRaw: async () => { throw new Error('private connection details'); } };
  await request(createApp(unavailable, 8, 10)).get('/api/health').expect(503, {
    error: { code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable.' },
  });
});
