import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import DamageValidation from "../validations/DamageValidation";
import DamageController from "../controllers/farmer/DamageController";
import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";

const productStockRedisMiddleware = new ProductStockRedisMiddleware();

const router = Router();
router.use(Auth);
router
    .route("/damages")
    .post(validate(DamageValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        DamageController.create)
    .get(DamageController.getAll);

router
    .route("/damages/:id")
    .put(validate(DamageValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        DamageController.update)
    .get(DamageController.getById)
    .delete(
        productStockRedisMiddleware.clearProductStockCache(),
        DamageController.delete
    );

export default router;