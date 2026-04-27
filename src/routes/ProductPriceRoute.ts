import { Router } from "express";
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import ProductPriceValidation from "../validations/ProductPriceValidation";
import ProductPriceController from "../controllers/farmer/ProductPriceController";
import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";

const productStockRedisMiddleware = new ProductStockRedisMiddleware();
const router = Router();

router
    .route("/product-prices")
    .post(
        Auth,
        validate(ProductPriceValidation.createOrUpdate),
        productStockRedisMiddleware.clearProductStockCache(),
        ProductPriceController.createOrUpdate
    );

router
    .route("/product-prices")
    .get(
        Auth,
        ProductPriceController.getProductPrices
    );

export default router;