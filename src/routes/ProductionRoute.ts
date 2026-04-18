import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import ProductionValidation from "../validations/ProductionValidation";
import ProductionController from "../controllers/farmer/ProductionController";

const router = Router();

router.use(Auth);
router
    .route("/productions")
    .post(validate(ProductionValidation.create), ProductionController.create)
    .get(ProductionController.getAll);

router
    .route("/productions/:id")
    .put(validate(ProductionValidation.create), ProductionController.update)
    .get(ProductionController.getById)
    .delete(ProductionController.delete);

export default router;