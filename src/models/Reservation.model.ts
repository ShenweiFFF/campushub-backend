import { HydratedDocument, Model, model, Schema, Types } from "mongoose";
import {
  RESERVATION_STATUSES,
  ReservationStatus,
} from "../types/reservation";

export interface IReservation {
  resourceId: Types.ObjectId;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

export type ReservationDocument = HydratedDocument<IReservation>;

const reservationSchema: Schema<IReservation> = new Schema<IReservation>(
  {
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, trim: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: RESERVATION_STATUSES,
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export const ReservationModel: Model<IReservation> = model<IReservation>(
  "Reservation",
  reservationSchema,
);
