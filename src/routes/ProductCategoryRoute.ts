import { Router } from "express";
const router = Router();


import { validate } from "../utils/validation.middleware";
import ProductCategoryValidation from "../validations/ProductCategoryValidation";
import ProductCategoryController from "../controllers/admin/ProductCategoryController";
import { Auth } from "../middlewares/Auth";

router
    .route("/categories")
    .post(
        Auth,
        validate(ProductCategoryValidation.createCategorySchema),
        ProductCategoryController.create
    )
    .get(ProductCategoryController.getAll);

router
    .route("/categories/:id")
    .get(ProductCategoryController.getById)
    .put(
        Auth,
        validate(ProductCategoryValidation.updateCategorySchema),
        ProductCategoryController.update
    )
    .delete(Auth, ProductCategoryController.delete);

export default router;