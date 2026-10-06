import { QueryFilter } from "mongoose";
import { IResource, ResourceDocument, ResourceModel } from "../models/Resource.model";
import {
  AppError,
  isResourceType,
  Resource,
  ResourceType,
} from "../types/reservation";

export function toResourceDto(doc: ResourceDocument): Resource {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    location: doc.location,
    isAvailable: doc.isAvailable,
  };
}

export async function listResources(typeFilter?: string): Promise<Resource[]> {
  const filter: QueryFilter<IResource> = {};

  if (typeFilter !== undefined) {
    if (typeFilter.trim().length === 0 || !isResourceType(typeFilter)) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "type must be a non-empty string when provided.",
      );
    }
    const resourceType: ResourceType = typeFilter;
    filter.type = resourceType;
  }

  const docs: ResourceDocument[] = await ResourceModel.find(filter).sort({ _id: 1 });
  return docs.map(toResourceDto);
}
