# CampusHub Backend

Express + TypeScript + Mongoose, organised as routes -> controllers -> services -> models (see `AGENTS.md`).

## Running

1. `npm install`
2. Start a MongoDB instance and copy `.env-example` to `.env` (set `MONGODB_URI`, `PORT`).
3. `npm run seed` — inserts the sample resources. Resource ids are now MongoDB ObjectIds, so fetch them with `GET /api/v1/resources` instead of using the old hardcoded `res-101` ids.
4. `npm run dev` — compiles and starts the API on `PORT`.

## Endpoints

See `docs/openapi.yaml`: `GET /resources`, `POST /reservations`, `GET /reservations/user/{userId}`, `GET /health`.
