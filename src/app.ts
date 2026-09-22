import express, {
  Application,
  NextFunction,
  Request,
  Response,
} from "express";
import healthRouter from "./routes/health.routes";

const app: Application = express();

app.use(express.json());
app.use("/api/v1", healthRouter);

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message: string =
    err instanceof Error ? err.message : "Internal Server Error";
  res.status(500).json({ error: message });
}

app.use(errorHandler);

const port: number = Number(process.env.PORT) || 3000;

app.listen(port, (): void => {
  console.log(`CampusHub backend listening on port ${port}`);
});
