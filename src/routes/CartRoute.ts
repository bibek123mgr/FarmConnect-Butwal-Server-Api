import { Router } from "express";
import CartController from "../controllers/CartController";
import { Auth } from "../middlewares/Auth";
import CartValidation from "../validations/CartValidation";
import { validate } from "../utils/validation.middleware";

const router = Router();

router.use(Auth);

router
    .route("/carts")
    .post(
        validate(CartValidation.addToCartSchema), CartController.add);

router
    .route("/carts/my")
    .get(CartController.getMyCart);

router
    .route("/carts/clearall")
    .delete(CartController.clear);
    
router
    .route("/carts/:id")
    .put(
        validate(CartValidation.updateCartSchema), CartController.update)
    .delete(CartController.remove);



export default router;