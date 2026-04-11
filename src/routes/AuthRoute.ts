import { Router } from "express";
const router = Router();
import AuthController from "../controllers/auth/AuthController";
import AuthValidation from "../validations/AuthValidation";

router.post('/register',AuthValidation.register, AuthController.register);
router.post('/login', AuthValidation.login, AuthController.login);


export default router;