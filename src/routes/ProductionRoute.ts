import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import ProductionValidation from "../validations/ProductionValidation";
import ProductionController from "../controllers/farmer/ProductionController";

const router = Router();

router
    .route("/productions")
    .post(Auth, validate(ProductionValidation.create), ProductionController.create)
    .get(Auth, ProductionController.getAll);

router
    .route("/productions/:id")
    .get(Auth, ProductionController.getById)
    .delete(Auth, ProductionController.delete);

export default router;