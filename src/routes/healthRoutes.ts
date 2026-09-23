import { Router } from 'express';
import { getHealth } from '../controllers/healthController';

const healthRoutes: Router = Router();

healthRoutes.get('/health', getHealth);

export { healthRoutes };
