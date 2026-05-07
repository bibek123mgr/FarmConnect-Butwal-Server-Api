import { Router } from "express";
import AuthController from "../controllers/auth/AuthController";
import { Auth } from "../middlewares/Auth";
const router = Router();
router.get('/users', Auth, AuthController.getAllUsers);
router.get('/get-dashboard-static',Auth, AuthController.getDashboardStatic);

export default router;