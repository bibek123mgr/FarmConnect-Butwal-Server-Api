import { Router } from "express";
import DashboardController from "../controllers/DashboardController";

const router = Router();

router.get("/dashboard/stats", DashboardController.getDashboardStats);

export default router;