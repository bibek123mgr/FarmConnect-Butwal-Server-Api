import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import DamageValidation from "../validations/DamageValidation";
import DamageController from "../controllers/farmer/DamageController";

const router = Router();
router.use(Auth);
router
    .route("/damages")
    .post(validate(DamageValidation.create), DamageController.create)
    .get(DamageController.getAll);

router
    .route("/damages/:id")
    .put(validate(DamageValidation.create), DamageController.update)
    .get(DamageController.getById)
    .delete(DamageController.delete);

export default router;