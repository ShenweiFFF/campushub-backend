# CampusHub — AI Agent Context Rules

CampusHub is a campus resource and reservation system. The backend is
TypeScript, Express, and MongoDB (Mongoose). The React client lives in
`client/`. If a request conflicts with these rules, follow the rules and
say so.

Canonical short form for Cursor is `.cursorrules`. Ignore patterns are in
`.cursorignore`. Do not read dependencies, lockfiles, `dist/`, `build/`,
coverage, logs, or source maps.

## 1. Tech Stack

- TypeScript only. No `.js` source. Backend `src/` is `.ts`. React
  components are `.tsx` and stay under `client/`.
- Backend framework: Express. Database: Mongoose. No other ORM or raw
  driver calls.
- Client HTTP: `fetch`. Do not add axios unless asked.
- Do not add an npm package unless asked.

## 2. Layers

| Layer | Path | Owns | Must not |
|---|---|---|---|
| Routes | `src/routes/` | Path wiring | Business logic, database |
| Controllers | `src/controllers/` | Parse input, call a service, set status | Mongoose, per-handler try/catch |
| Middleware | `src/middleware/errorHandler.ts` | Map thrown errors to HTTP JSON | Business rules |
| Services | `src/services/` | Business logic | `Request` / `Response` |
| Models | `src/models/` | Schemas and document interfaces | Business logic |
| Contracts | `src/types/contracts.ts` | Shared resource and reservation types | Express or React |

Controllers throw `AppError`. Express 5 passes that rejection to
`errorHandler`. Every function signature is explicit. `any` is banned.
Mongoose schemas keep a matching TypeScript interface.

## 3. Client

- Functional components with an explicit props interface.
- Reservation fetch and submit state live in
  `client/src/hooks/useReservations.ts`. Do not call the API from JSX.
- CSS modules only.
- Import models from `src/types/contracts.ts`. Do not copy them into the
  client.
- Async UI shows loading and an error. Reservation 409 text is
  "This resource is already reserved for the selected time window".

## 4. Commits

Imperative subject, under 10 words. One short body that names the rule
above that motivated the change. No emojis. Never commit `.env`,
`node_modules/`, or `dist/`.
