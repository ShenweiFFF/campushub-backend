import express, { NextFunction, Request, Response } from 'express';
import { healthRoutes } from './routes/healthRoutes';

const app = express();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use('/api/v1', healthRoutes);

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const message: string =
      err instanceof Error ? err.message : 'Internal Server Error';
    res.status(500).json({ error: message });
  }
);

app.listen(port, (): void => {
  console.log(`CampusHub backend listening on port ${port}`);
});

export { app };
