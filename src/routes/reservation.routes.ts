import { Router } from "express";
import {
  getUserReservations,
  patchCancelReservation,
  patchConfirmReservation,
  postReservation,
} from "../controllers/reservation.controller";

const reservationRouter: Router = Router();

reservationRouter.post("/reservations", postReservation);
reservationRouter.get("/reservations/user/:userId", getUserReservations);
reservationRouter.patch("/reservations/:id/cancel", patchCancelReservation);
reservationRouter.patch("/reservations/:id/confirm", patchConfirmReservation);

export default reservationRouter;
