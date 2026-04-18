import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import DamageValidation from "../validations/DamageValidation";
import DamageController from "../controllers/farmer/DamageController";

const router = Router();

router
    .route("/damages")
    .post(Auth, validate(DamageValidation.create), DamageController.create)
    .get(Auth, DamageController.getAll);

router
    .route("/damages/:id")
    .get(Auth, DamageController.getById)
    .delete(Auth, DamageController.delete);

export default router;