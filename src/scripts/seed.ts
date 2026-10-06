import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { IResource, ResourceModel } from "../models/Resource.model";

const SEED_RESOURCES: IResource[] = [
  { name: "Study Room 302", type: "STUDY_ROOM", location: "Library Floor 3", isAvailable: true },
  { name: "3D Printer A", type: "EQUIPMENT", location: "Maker Space", isAvailable: true },
  { name: "Chem Lab 1", type: "LAB", location: "Science Building", isAvailable: true },
  { name: "Lecture Room 201", type: "ROOM", location: "Main Hall", isAvailable: true },
];

async function seed(): Promise<void> {
  await connectDatabase();
  await ResourceModel.deleteMany({});
  const created: number = (await ResourceModel.insertMany(SEED_RESOURCES)).length;
  console.log(`Seeded ${created} resources`);
  await mongoose.disconnect();
}

seed().catch((err: unknown): void => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
