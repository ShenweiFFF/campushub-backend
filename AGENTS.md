# CampusHub Backend — AI Agent Context Rules

## Project Overview

CampusHub is a multi-tenant campus resource management system. This
repository (`campushub-backend`) is the backend service, built with
TypeScript, Node.js, Express, and MongoDB (via Mongoose).

Any AI coding agent (Claude Code, Cursor, Copilot, etc.) working in this
repository MUST follow the rules below. If a request conflicts with these
rules, follow the rules and flag the conflict instead of silently
overriding them.

---

## 1. Tech Stack & Authorized Libraries

- **Language:** TypeScript only. Never create or edit `.js` source files —
  everything under `src/` must be `.ts`.
- **Framework:** Express only. Do not introduce Fastify, Koa, NestJS, or
  any other web framework.
- **Database:** MongoDB via Mongoose only. No raw MongoDB driver calls,
  no other ORMs (Prisma, TypeORM, etc.).
- **Dependencies:** Do not add a new npm package without explicit
  approval. If a task seems to need one, stop and ask first instead of
  installing it.

## 2. Architectural Boundaries (strict 3-tier separation)

Every file belongs to exactly one layer. Do not mix responsibilities
across layers.

| Layer | Path | Responsibility | Forbidden |
|---|---|---|---|
| **Routes** | `src/routes/` | Route definitions and middleware wiring only | Any business logic, any DB access |
| **Controllers** | `src/controllers/` | Parse request, call a service, set status code, shape the response | Direct database queries (no `Model.find()`, no Mongoose calls here) |
| **Services** | `src/services/` | Pure business logic | No `Request`/`Response` objects; services must not know about Express |
| **Models** | `src/models/` | Mongoose schemas + matching TypeScript interfaces | No business logic |

If generated code puts a database query in a controller, or business
logic in a route file, that is a violation — refactor it into the
correct layer before returning the result.

## 3. Coding Standards & Safety

- Every function signature (parameters and return type) must be
  explicitly typed. No implicit `any`.
- The `any` type is **banned** everywhere. Use `unknown` with a type
  guard, a proper generic, or a defined interface instead.
- Every Mongoose schema must have a corresponding TypeScript interface
  describing its shape.
- Every `async` function must handle errors — either a `try/catch` that
  forwards to `next(err)`, or centralized error-handling middleware.
  No unhandled promise rejections.
- Respect the existing ESLint/Prettier config. Never disable a lint rule
  just to make code compile — fix the underlying issue instead.

## 4. Git & Commit Formatting

When generating a commit message or PR description:

1. First line: imperative mood, under ~10 words
   (e.g. `Add health-check endpoint`).
2. Short body explaining **why**, explicitly naming which rule(s) from
   this file applied
   (e.g. "Controller delegates DB access to a service per the 3-tier
   rule in AGENTS.md").
3. No emojis, no marketing language, no filler. Keep the whole message
   under ~150 words.

## Additional Agent Behavior

- Never commit `.env`, `node_modules/`, or `dist/` — confirm `.gitignore`
  covers them before finishing a task.
- Before creating a new file, check whether an existing file in the
  correct layer should be extended instead.
- After generating code, self-check it against Sections 1–3 above and
  call out any deviation explicitly rather than letting it pass silently.
- If a request is ambiguous with respect to these rules, ask a
  clarifying question rather than guessing.
