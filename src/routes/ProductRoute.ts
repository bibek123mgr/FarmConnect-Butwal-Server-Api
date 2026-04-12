import { Router } from "express";
const router = Router();
import ProductController from "../controllers/farmer/ProductController";
import { Auth } from "../middlewares/Auth";
import ProductValidation from "../validations/ProductValidation";
import { validate } from "../utils/validation.middleware";

router
    .route("/products")
    .post(Auth, validate(ProductValidation.create), ProductController.create)
    .put(Auth, validate(ProductValidation.update),
        ProductController.update)
    .get(Auth, ProductController.getAll);

router
    .route("/products/:id")
    .get(Auth, ProductController.getById)
    .delete(Auth, ProductController.delete);

export default router;