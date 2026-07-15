import { Router } from "express";
const router = Router();


import { validate } from "../utils/validation.middleware";
import ProductCategoryValidation from "../validations/ProductCategoryValidation";
import ProductCategoryController from "../controllers/admin/ProductCategoryController";
import { Auth } from "../middlewares/Auth";
import ProductCategoryRedisMiddleware from "../middlewares/ProductCategoryRedisMiddleware.";
import { upload } from "../middlewares/MulterConfig";

const productCategoryRedisMiddleware = new ProductCategoryRedisMiddleware();

router
    .route("/categories")
    .post(
        Auth,
        validate(ProductCategoryValidation.createCategorySchema),
        productCategoryRedisMiddleware.clearProductCategoryCache(),
        upload.single("image"),
        ProductCategoryController.create
    )
    .get(
        productCategoryRedisMiddleware.getCachedProductCategory(), ProductCategoryController.getAll);

router.get("/categories/stats",
    Auth, ProductCategoryController.stats);

router
    .route("/categories/:id")
    .get(ProductCategoryController.getById)
    .put(
        Auth,
        validate(ProductCategoryValidation.updateCategorySchema),
        productCategoryRedisMiddleware.clearProductCategoryCache(),
        ProductCategoryController.update
    )
    .delete(
        Auth,
        productCategoryRedisMiddleware.clearProductCategoryCache(), ProductCategoryController.delete);

export default router;