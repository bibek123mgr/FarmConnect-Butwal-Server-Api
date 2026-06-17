import { Router } from "express";
import DashboardController from "../controllers/DashboardController";
import { Auth } from "../middlewares/Auth";

const router = Router();

router.get("/dashboard/stats",Auth, DashboardController.getDashboardStats);

export default router;