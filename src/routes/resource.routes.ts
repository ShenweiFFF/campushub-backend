import { Router } from "express";
import { getResources } from "../controllers/resource.controller";

const resourceRouter: Router = Router();

resourceRouter.get("/resources", getResources);

export default resourceRouter;
