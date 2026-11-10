import { Request, Response } from "express";
import request from "supertest";
import app from "../../app";
import { postReservation } from "../../controllers/reservation.controller";
import { ResourceModel } from "../../models/Resource.model";

interface ReservationBody {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface ErrorBody {
  code: string;
  message: string;
}

const START: string = "2026-11-01T10:00:00.000Z";
const END: string = "2026-11-01T11:00:00.000Z";

async function createResource(
  type: "ROOM" | "LAB" = "ROOM",
  isAvailable: boolean = true,
): Promise<string> {
  const doc = await ResourceModel.create({
    name: type === "LAB" ? "Chem Lab 1" : "Lecture Room 201",
    type,
    location: "Main Hall",
    isAvailable,
  });
  return doc._id.toString();
}

describe("reservation routes", () => {
  it("returns 201 when a reservation is created", async () => {
    const resourceId: string = await createResource();
    const response = await request(app).post("/api/v1/reservations").send({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    expect(response.status).toBe(201);
    const body = response.body as ReservationBody;
    expect(body.status).toBe("PENDING");
    expect(body.resourceId).toBe(resourceId);
    expect(body.userId).toBe("student-1");
  });

  it("returns 409 when the window overlaps an active reservation", async () => {
    const resourceId: string = await createResource();
    await request(app).post("/api/v1/reservations").send({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });

    const response = await request(app).post("/api/v1/reservations").send({
      resourceId,
      userId: "student-2",
      startTime: "2026-11-01T10:30:00.000Z",
      endTime: "2026-11-01T11:30:00.000Z",
    });

    expect(response.status).toBe(409);
    const body = response.body as ErrorBody;
    expect(body.code).toBe("DOUBLE_BOOKING");
  });

  it("returns 400 for a missing payload, a negative range, and an unknown resource", async () => {
    const missing = await request(app).post("/api/v1/reservations").send({});
    expect(missing.status).toBe(400);
    expect((missing.body as ErrorBody).code).toBe("VALIDATION_ERROR");

    const res = {} as Response;
    await expect(postReservation({ body: "nope" } as Request, res)).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
    await expect(postReservation({ body: null } as Request, res)).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });

    const resourceId: string = await createResource();
    const backwards = await request(app).post("/api/v1/reservations").send({
      resourceId,
      userId: "student-1",
      startTime: END,
      endTime: START,
    });
    expect(backwards.status).toBe(400);
    expect((backwards.body as ErrorBody).code).toBe("VALIDATION_ERROR");

    const unknown = await request(app).post("/api/v1/reservations").send({
      resourceId: "507f1f77bcf86cd799439011",
      userId: "student-1",
      startTime: START,
      endTime: END,
    });
    expect(unknown.status).toBe(400);
  });

  it("lists, confirms, and cancels a student's reservation", async () => {
    const resourceId: string = await createResource();
    const created = await request(app).post("/api/v1/reservations").send({
      resourceId,
      userId: "student-1",
      startTime: START,
      endTime: END,
    });
    const reservation = created.body as ReservationBody;

    const listed = await request(app).get("/api/v1/reservations/user/student-1");
    expect(listed.status).toBe(200);
    expect(listed.body).toEqual([expect.objectContaining({ id: reservation.id, status: "PENDING" })]);

    const confirmed = await request(app).patch(`/api/v1/reservations/${reservation.id}/confirm`);
    expect(confirmed.status).toBe(200);
    expect((confirmed.body as ReservationBody).status).toBe("CONFIRMED");

    const confirmedAgain = await request(app).patch(`/api/v1/reservations/${reservation.id}/confirm`);
    expect(confirmedAgain.status).toBe(200);
    expect((confirmedAgain.body as ReservationBody).status).toBe("CONFIRMED");

    const cancelled = await request(app).patch(`/api/v1/reservations/${reservation.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect((cancelled.body as ReservationBody).status).toBe("CANCELLED");

    const afterCancel = await request(app).get("/api/v1/reservations/user/student-1");
    expect(afterCancel.status).toBe(200);
    expect(afterCancel.body).toEqual([]);

    const confirmCancelled = await request(app).patch(
      `/api/v1/reservations/${reservation.id}/confirm`,
    );
    expect(confirmCancelled.status).toBe(400);
  });

  it("returns 400 or 404 for a bad reservation id and a blank user id", async () => {
    const badId = await request(app).patch("/api/v1/reservations/not-an-id/cancel");
    expect(badId.status).toBe(400);

    const missing = await request(app).patch(
      "/api/v1/reservations/507f1f77bcf86cd799439011/cancel",
    );
    expect(missing.status).toBe(404);
    expect((missing.body as ErrorBody).code).toBe("NOT_FOUND");

    const blankUser = await request(app).get("/api/v1/reservations/user/%20");
    expect(blankUser.status).toBe(400);
  });

  it("returns 200 for resource filters and 400 for invalid query params", async () => {
    await createResource("ROOM", true);
    await createResource("LAB", false);

    const rooms = await request(app).get("/api/v1/resources").query({ type: "ROOM", isAvailable: "true" });
    expect(rooms.status).toBe(200);
    expect(rooms.body).toEqual([
      expect.objectContaining({ type: "ROOM", isAvailable: true }),
    ]);

    const labs = await request(app).get("/api/v1/resources").query({ type: "LAB", isAvailable: "false" });
    expect(labs.status).toBe(200);
    expect(labs.body).toEqual([
      expect.objectContaining({ type: "LAB", isAvailable: false }),
    ]);

    const all = await request(app).get("/api/v1/resources");
    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(2);

    const badType = await request(app).get("/api/v1/resources").query({ type: "NOPE" });
    expect(badType.status).toBe(400);

    const blankType = await request(app).get("/api/v1/resources").query({ type: " " });
    expect(blankType.status).toBe(400);

    const repeatedType = await request(app).get("/api/v1/resources?type=ROOM&type=LAB");
    expect(repeatedType.status).toBe(400);

    const badAvailability = await request(app).get("/api/v1/resources").query({ isAvailable: "yes" });
    expect(badAvailability.status).toBe(400);
  });

  it("returns 200 from the health endpoint", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
