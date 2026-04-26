import { Router } from "express";
const router = Router();
import ProductController from "../controllers/farmer/ProductController";
import { Auth } from "../middlewares/Auth";
import ProductValidation from "../validations/ProductValidation";
import { validate } from "../utils/validation.middleware";

import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";

const productStockRedisMiddleware = new ProductStockRedisMiddleware();

router
    .route("/products")
    .post(
        Auth,
        validate(ProductValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        ProductController.create)
    .get(
        Auth,
        productStockRedisMiddleware.getCachedProductStock(),
        ProductController.getAll
    );


router
    .route("/products/my")
    .get(
        Auth,
        ProductController.getAllMyProducts
    );
router
    .route("/products/:id")
    .put(
        Auth,
        validate(ProductValidation.update),
        productStockRedisMiddleware.clearProductStockCache(),
        productStockRedisMiddleware.getCachedProductStockById(),
        ProductController.update)
    .get(
        Auth,
        ProductController.getById)
    .delete(
        Auth,
        productStockRedisMiddleware.clearProductStockCache(),
        productStockRedisMiddleware.getCachedProductStockById(),
        ProductController.delete);

export default router;