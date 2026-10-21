# Lab 4 Steering Log

### Incident 1: isAvailable query matched nothing

- **Initial Agent Output:** `GET /api/v1/resources` only filtered on `type`. The first wiring passed `req.query.isAvailable` through as a string field on the Mongoose filter.
- **Root Cause:** Express query parameters are strings. The schema field is a boolean, so `{ isAvailable: "true" }` does not match documents stored as `true`. Values other than `true` or `false` also need a 400 instead of a silent empty list.
- **Remediation Prompt:** In the controller, accept only the query literals `true` and `false`, convert them to booleans, and pass that boolean into `listResources`. Reject any other value with 400 `VALIDATION_ERROR`. Keep the Mongoose query in the service, not the controller.
- **Resolution:** `readBooleanQuery` parses the query string before the service builds the filter. Against a temporary MongoDB, `GET /api/v1/resources?type=EQUIPMENT&isAvailable=true` returned no rows after that resource was marked unavailable, and `isAvailable=false` returned it. `isAvailable=yes` returned 400.

### Incident 2: Cancelled reservations could not free a slot

- **Initial Agent Output:** `createReservation` treated every status other than `CANCELLED` as blocking, but no endpoint could set `CANCELLED` or `CONFIRMED`. A created booking stayed `PENDING` forever, so the "cancel frees the time slot" rule could not be exercised. Using `$ne: "CANCELLED"` also blocks any future status that is not an active booking.
- **Root Cause:** Status transitions were missing from the service, and the overlap predicate was the complement of cancelled instead of the active set named in the lab (`PENDING` or `CONFIRMED`). The overlap formula itself is `existing.startTime < new endTime` AND `existing.endTime > new startTime`; inclusive `$lte` / `$gte` would falsely 409 a booking that starts exactly when another ends.
- **Remediation Prompt:** Before insert, query the same `resourceId` where status is `PENDING` or `CONFIRMED`, `startTime` is strictly less than the new `endTime`, and `endTime` is strictly greater than the new `startTime`. Return 409 `DOUBLE_BOOKING` on a hit. Add `PATCH /api/v1/reservations/{id}/cancel` to set `CANCELLED`, and `PATCH /api/v1/reservations/{id}/confirm` to move `PENDING` to `CONFIRMED`. A cancelled reservation must drop out of the overlap query. Do not call Mongoose from the controller.
- **Resolution:** `hasActiveOverlap` uses `$in: ["PENDING", "CONFIRMED"]` with `$lt` / `$gt`. Cancel saves `CANCELLED` and returns 200. Confirm refuses a cancelled reservation with 400 and re-checks the slot, excluding itself, before saving `CONFIRMED`. Missing ids return 404. User listing stays limited to `PENDING` and `CONFIRMED`, matching `docs/openapi.yaml`. Live requests confirmed a partial overlap returns 409, a booking that starts exactly when another ends returns 201, a confirmed booking still blocks the slot, and cancelling it lets the same interval be reserved again.
