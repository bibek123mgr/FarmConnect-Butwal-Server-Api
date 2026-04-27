import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import ProductionValidation from "../validations/ProductionValidation";
import ProductionController from "../controllers/farmer/ProductionController";
import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";
const productStockRedisMiddleware = new ProductStockRedisMiddleware();
const router = Router();

router.use(Auth);
router
    .route("/productions")
    .post(
        validate(ProductionValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        ProductionController.create)
    .get(ProductionController.getAll);

router
    .route("/productions/:id")
    .put(
        validate(ProductionValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        ProductionController.update
    )
    .get(ProductionController.getById)
    .delete(
        productStockRedisMiddleware.clearProductStockCache(),ProductionController.delete);

export default router;