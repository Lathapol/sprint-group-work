# Lab 5 deployment

The Workflow and Approval System uses React/Vite, Express, Prisma and PostgreSQL. The runtime image serves the UI and API from one port. PostgreSQL stores sessions, requests and their history. Local Compose keeps its database in a named volume.

| Variable | Purpose | Secret | Value source |
| --- | --- | --- | --- |
| DATABASE_URL | Application and migration database connection | Yes | Local environment, Compose, or GCP Secret Manager |
| PORT | HTTP port, defaults to 3000 | No | Local environment or Cloud Run |
| NODE_ENV | Use production to require HTTPS for session cookies | No | Runtime image; Compose uses development for local HTTP |
| SESSION_TTL_HOURS | Session lifetime, defaults to 8 | No | Runtime environment |
| BCRYPT_ROUNDS | Password hashing cost, defaults to 12 | No | Runtime or seed environment |
| SEED_PASSWORD | Password for synthetic demo accounts | Yes | Local environment, disposable CI fixture, or Secret Manager |
| TEST_DATABASE_URL | Isolated database for integration/browser tests | Yes | Local environment or disposable CI PostgreSQL service |

From a clean clone, run docker compose up --build and open http://localhost:3000. Compose runs migrations before starting the app. Check /api/health for database readiness. To seed demo accounts locally, set SEED_PASSWORD to a disposable value in your shell and run docker compose run --rm -e SEED_PASSWORD migrate node prisma/seed.cjs. Never point the demo seed at real user data. Use docker compose down to stop the stack and retain the volume.

For a native build, run npm ci, npx prisma generate, and npm run build. Set DATABASE_URL before npx prisma migrate deploy and npm start. Run npm test against a separate migrated TEST_DATABASE_URL. Seed that test database, install Chromium with npx playwright install chromium, and run npm run test:e2e with TEST_DATABASE_URL and SEED_PASSWORD set. The PR workflow performs these steps with a disposable database.

The lab release path is a reviewed feature PR into sprint-1-staging, followed by a reviewed release PR into main. Set test-and-docker as a required check once it has run on GitHub. Capture both a passing PR and a blocked temporary PR as evidence.

GCP setup is pending. Record the project, region, service, database and registry here after provisioning. The intended release workflow builds an image tagged with the main commit SHA, migrates the database, deploys the image to Cloud Run and checks the live URL. Record the running revision and image digest alongside the commit SHA in the deployment run. Capture the same record before and after both a restart and a redeploy.
