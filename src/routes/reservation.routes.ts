import { Router } from "express";
import {
  getUserReservations,
  postReservation,
} from "../controllers/reservation.controller";

const reservationRouter: Router = Router();

reservationRouter.post("/reservations", postReservation);
reservationRouter.get("/reservations/user/:userId", getUserReservations);

export default reservationRouter;
