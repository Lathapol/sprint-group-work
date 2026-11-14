import 'dotenv/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app';

const db = new PrismaClient();
const port = Number(process.env.PORT ?? 3000);
const ttl = Number(process.env.SESSION_TTL_HOURS ?? 8);
const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

const app = createApp(db, ttl, rounds);
const webRoot = resolve(__dirname, '../web/dist');
const index = resolve(webRoot, 'index.html');
if (existsSync(index)) {
  app.use(express.static(webRoot, { index: false }));
  app.get(/^\/(?!api(?:\/|$))/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.sendFile(index);
  });
}

const server = app.listen(port, () => {
  console.log('API listening on port', port);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => void db.$disconnect()));
}
