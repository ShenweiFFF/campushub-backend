import { HydratedDocument, Model, model, Schema } from "mongoose";
import { RESOURCE_TYPES, ResourceType } from "../types/reservation";

export interface IResource {
  name: string;
  type: ResourceType;
  location: string;
  isAvailable: boolean;
}

export type ResourceDocument = HydratedDocument<IResource>;

const resourceSchema: Schema<IResource> = new Schema<IResource>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: RESOURCE_TYPES },
    location: { type: String, required: true, trim: true },
    isAvailable: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export const ResourceModel: Model<IResource> = model<IResource>(
  "Resource",
  resourceSchema,
);
