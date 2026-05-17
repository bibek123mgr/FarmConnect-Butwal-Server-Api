import { Router } from "express";
const router = Router();
import ProductController from "../controllers/farmer/ProductController";
import { Auth } from "../middlewares/Auth";
import ProductValidation from "../validations/ProductValidation";
import { validate } from "../utils/validation.middleware";

import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";
import { upload } from "../middlewares/MulterConfig";

const productStockRedisMiddleware = new ProductStockRedisMiddleware();

router
    .route("/products")
    .post(
        Auth,
        validate(ProductValidation.create),
        productStockRedisMiddleware.clearProductStockCache(),
        upload.single("image"),
        ProductController.create)
    .get(
        productStockRedisMiddleware.getCachedProductStock(),
        ProductController.getAll
    );


router
    .route("/products/my")
    .get(
        Auth,
        validate(ProductValidation.getAllProductForAdmin),
        ProductController.getAllMyProducts
    );
router
    .route("/products/:id")
    .put(
        Auth,
        validate(ProductValidation.update),
        productStockRedisMiddleware.clearProductStockCache(),
        productStockRedisMiddleware.getCachedProductStockById(),
        upload.single("image"),
        ProductController.update)
    .get(
        ProductController.getById)
    .delete(
        Auth,
        productStockRedisMiddleware.clearProductStockCache(),
        productStockRedisMiddleware.getCachedProductStockById(),
        ProductController.delete);

export default router;