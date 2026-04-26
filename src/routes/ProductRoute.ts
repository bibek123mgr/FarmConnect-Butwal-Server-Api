import { Router } from "express";
const router = Router();
import ProductController from "../controllers/farmer/ProductController";
import { Auth } from "../middlewares/Auth";
import ProductValidation from "../validations/ProductValidation";
import { validate } from "../utils/validation.middleware";
import ProductRedisMiddleware from "../middlewares/productRedisMiddleware";

router
    .route("/products")
    .post(
        Auth,
        validate(ProductValidation.create),
        ProductRedisMiddleware.removeProductCache(),
        ProductController.create)
    .get(
        Auth,
        ProductRedisMiddleware.getProductFromCache(),
        ProductController.getAll
    );

router
    .route("/products/:id")
    .put(
        Auth,
        validate(ProductValidation.update),
        ProductRedisMiddleware.removeOneProductCache(),
        ProductRedisMiddleware.removeProductCache(),
        ProductController.update)
    .get(
        Auth,
        ProductRedisMiddleware.getOneProductFromCache(),
        ProductController.getById)
    .delete(
        Auth,
        ProductRedisMiddleware.removeOneProductCache(),
        ProductRedisMiddleware.removeProductCache(),
        ProductController.delete);

export default router;