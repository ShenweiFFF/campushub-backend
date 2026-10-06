import express, {
  Application,
  NextFunction,
  Request,
  Response,
} from "express";
import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import healthRouter from "./routes/health.routes";
import reservationRouter from "./routes/reservation.routes";
import resourceRouter from "./routes/resource.routes";
import { AppError, ErrorResponse } from "./types/reservation";

const app: Application = express();

app.use(express.json());
app.use("/api/v1", healthRouter);
app.use("/api/v1", resourceRouter);
app.use("/api/v1", reservationRouter);

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const payload: ErrorResponse = { code: err.code, message: err.message };
    res.status(err.statusCode).json(payload);
    return;
  }

  const message: string =
    err instanceof Error ? err.message : "Internal Server Error";
  const payload: ErrorResponse = { code: "INTERNAL_ERROR", message };
  res.status(500).json(payload);
}

app.use(errorHandler);

async function start(): Promise<void> {
  await connectDatabase();
  app.listen(config.port, (): void => {
    console.log(`CampusHub backend listening on port ${config.port}`);
  });
}

start().catch((err: unknown): void => {
  console.error("Failed to start CampusHub backend:", err);
  process.exit(1);
});

export default app;
