import { Router } from "express";
import CartController from "../controllers/CartController";
import { Auth } from "../middlewares/Auth";
import CartValidation from "../validations/CartValidation";
import { validate } from "../utils/validation.middleware";
import CartRedisMiddleware from "../middlewares/cartRedisMiddleware";

const router = Router();

router.use(Auth);

router
    .route("/carts")
    .post(
        validate(CartValidation.addToCartSchema),
        CartController.add);

router
    .route("/carts/my")
    .get(
        CartRedisMiddleware.getCartFromCache(),
        CartController.getMyCart
    );

router
    .route("/carts/increment/:id")
    .patch(
        CartRedisMiddleware.IncrenmentCart(),
        CartController.increase
    );

router
    .route("/carts/decrement/:id")
    .patch(
        CartRedisMiddleware.DecrementCart(),
        CartController.decrease
    );

router
    .route("/carts/clearall")
    .delete(
        CartRedisMiddleware.removeCartCache(),
        CartController.clear
    );

router
    .route("/carts/:id")
    // .put(
    //     validate(CartValidation.updateCartSchema),
    //      CartRedisMiddleware.removeCartCache(),
    //      CartController.update
    //     )
    .delete(
        CartRedisMiddleware.clearOneCartItem(),
        CartController.remove
    );



export default router;