import express, { Application } from "express";
import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/health.routes";
import reservationRouter from "./routes/reservation.routes";
import resourceRouter from "./routes/resource.routes";

const app: Application = express();

app.use(express.json());
app.use("/api/v1", healthRouter);
app.use("/api/v1", resourceRouter);
app.use("/api/v1", reservationRouter);
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();
  app.listen(config.port, (): void => {
    console.log(`CampusHub backend listening on port ${config.port}`);
  });
}

if (require.main === module) {
  start().catch((err: unknown): void => {
    console.error("Failed to start CampusHub backend:", err);
    process.exit(1);
  });
}

export default app;
