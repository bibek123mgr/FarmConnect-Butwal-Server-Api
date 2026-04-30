import { Router } from "express";
const router = Router();
import AuthController from "../controllers/auth/AuthController";
import AuthValidation from "../validations/AuthValidation";
import { Auth } from "../middlewares/Auth";
import AuthRedisMiddleware from "../middlewares/AuthRedisMiddleware";

const authRedisMiddleware = new AuthRedisMiddleware();

router.post('/register', AuthValidation.register, AuthController.register);
router.post('/login', AuthValidation.login, AuthController.login);
router.get('/getme', Auth, authRedisMiddleware.getMyProfileFromCache(), AuthController.me);
router.post('/refresh-token', Auth, AuthController.refreshToken);
router.post('/logout', Auth, AuthController.logout);


export default router;