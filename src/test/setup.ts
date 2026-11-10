import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let memoryServer: MongoMemoryServer | undefined;

beforeAll(async (): Promise<void> => {
  memoryServer = await MongoMemoryServer.create();
  const uri: string = memoryServer.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri);
});

afterEach(async (): Promise<void> => {
  const names: string[] = Object.keys(mongoose.connection.collections);
  for (const name of names) {
    await mongoose.connection.collections[name].deleteMany({});
  }
});

afterAll(async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer !== undefined) {
    await memoryServer.stop();
  }
});
