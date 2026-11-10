import { ResourceModel } from "../../models/Resource.model";
import { ReservationModel } from "../../models/Reservation.model";
import { AppError } from "../../types/reservation";
import {
  cancelReservation,
  confirmReservation,
  createReservation,
  listActiveReservationsByUser,
} from "../reservation.service";

const START: string = "2026-11-01T10:00:00.000Z";
const END: string = "2026-11-01T11:00:00.000Z";

async function createResource(): Promise<string> {
  const doc = await ResourceModel.create({
    name: "Lecture Room 201",
    type: "ROOM",
    location: "Main Hall",
    isAvailable: true,
  });
  return doc._id.toString();
}

async function expectAppError(
  run: () => Promise<unknown>,
  statusCode: number,
  code: string,
): Promise<void> {
  try {
    await run();
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.statusCode).toBe(statusCode);
      expect(error.code).toBe(code);
    }
    return;
  }
  throw new Error(`Expected AppError ${statusCode} ${code}`);
}

describe("reservation service", () => {
  it("creates a pending reservation and lists it for that student", async () => {
    const resourceId: string = await createResource();
    const created = await createReservation({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    expect(created.status).toBe("PENDING");
    expect(created.resourceId).toBe(resourceId);
    expect(created.userId).toBe("student-1");

    const mine = await listActiveReservationsByUser("student-1");
    const theirs = await listActiveReservationsByUser("student-2");
    expect(mine.map((item) => item.id)).toEqual([created.id]);
    expect(theirs).toEqual([]);
  });

  it("rejects an exact duplicate window and a 1 millisecond overlap", async () => {
    const resourceId: string = await createResource();
    await createReservation({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-2",
          startTime: START,
          endTime: END,
        }),
      409,
      "DOUBLE_BOOKING",
    );

    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-2",
          startTime: "2026-11-01T10:59:59.999Z",
          endTime: "2026-11-01T12:00:00.000Z",
        }),
      409,
      "DOUBLE_BOOKING",
    );
  });

  it("allows a booking that starts exactly when another ends", async () => {
    const resourceId: string = await createResource();
    await createReservation({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    const next = await createReservation({
      resourceId,
      userId: "student-2",
      startTime: END,
      endTime: "2026-11-01T12:00:00.000Z",
    });
    expect(next.status).toBe("PENDING");
  });

  it("rejects endTime before or equal to startTime and unparsable dates", async () => {
    const resourceId: string = await createResource();
    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-1",
          startTime: END,
          endTime: START,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-1",
          startTime: START,
          endTime: START,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-1",
          startTime: "tomorrow",
          endTime: END,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(
      () =>
        createReservation({
          resourceId,
          userId: "student-1",
          startTime: "2026-13-01T10:00:00.000Z",
          endTime: END,
        }),
      400,
      "VALIDATION_ERROR",
    );
  });

  it("rejects a missing resource and blank fields", async () => {
    await expectAppError(
      () =>
        createReservation({
          resourceId: "507f1f77bcf86cd799439011",
          userId: "student-1",
          startTime: START,
          endTime: END,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(
      () =>
        createReservation({
          resourceId: "not-an-id",
          userId: "student-1",
          startTime: START,
          endTime: END,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(
      () =>
        createReservation({
          resourceId: "   ",
          userId: "student-1",
          startTime: START,
          endTime: END,
        }),
      400,
      "VALIDATION_ERROR",
    );
    await expectAppError(() => listActiveReservationsByUser("  "), 400, "VALIDATION_ERROR");
  });

  it("cancels a reservation and then allows the same window again", async () => {
    const resourceId: string = await createResource();
    const created = await createReservation({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    const cancelled = await cancelReservation(created.id);
    expect(cancelled.status).toBe("CANCELLED");
    const again = await cancelReservation(created.id);
    expect(again.status).toBe("CANCELLED");

    const active = await listActiveReservationsByUser("student-1");
    expect(active).toEqual([]);

    const rebooked = await createReservation({
      resourceId,
      userId: "student-9",
      startTime: START,
      endTime: END,
    });
    expect(rebooked.status).toBe("PENDING");
  });

  it("confirms a pending reservation and refuses a cancelled one", async () => {
    const resourceId: string = await createResource();
    const created = await createReservation({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    const confirmed = await confirmReservation(created.id);
    expect(confirmed.status).toBe("CONFIRMED");
    const confirmedAgain = await confirmReservation(created.id);
    expect(confirmedAgain.status).toBe("CONFIRMED");

    const other = await createReservation({
      resourceId,
      userId: "student-2",
      startTime: "2026-11-02T10:00:00.000Z",
      endTime: "2026-11-02T11:00:00.000Z",
    });
    const cancelled = await cancelReservation(other.id);
    await expectAppError(() => confirmReservation(cancelled.id), 400, "VALIDATION_ERROR");
  });

  it("refuses to confirm when another active reservation overlaps", async () => {
    const resourceId: string = await createResource();
    await ReservationModel.create({
      resourceId,
      userId: "student-1",
      startTime: new Date(START),
      endTime: new Date(END),
      status: "PENDING",
    });
    const blocked = await ReservationModel.create({
      resourceId,
      userId: "student-2",
      startTime: new Date("2026-11-01T10:30:00.000Z"),
      endTime: new Date("2026-11-01T11:30:00.000Z"),
      status: "PENDING",
    });

    await expectAppError(
      () => confirmReservation(blocked._id.toString()),
      409,
      "DOUBLE_BOOKING",
    );
  });

  it("rejects unknown or blank reservation ids", async () => {
    await expectAppError(() => cancelReservation("not-an-id"), 400, "VALIDATION_ERROR");
    await expectAppError(() => cancelReservation("   "), 400, "VALIDATION_ERROR");
    await expectAppError(
      () => cancelReservation("507f1f77bcf86cd799439011"),
      404,
      "NOT_FOUND",
    );
  });

  it("accepts one of two concurrent bookings for the same window", async () => {
    const resourceId: string = await createResource();
    const input = {
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    };
    const settled = await Promise.allSettled([
      createReservation(input),
      createReservation({ ...input, userId: "student-2" }),
    ]);

    const failures = settled.filter((result) => result.status === "rejected");
    const successes = settled.filter((result) => result.status === "fulfilled");
    expect(successes.length).toBeGreaterThanOrEqual(1);
    expect(successes.length + failures.length).toBe(2);
    for (const failure of failures) {
      if (failure.status === "rejected") {
        expect(failure.reason).toBeInstanceOf(AppError);
        if (failure.reason instanceof AppError) {
          expect(failure.reason.statusCode).toBe(409);
          expect(failure.reason.code).toBe("DOUBLE_BOOKING");
        }
      }
    }
  });
});
