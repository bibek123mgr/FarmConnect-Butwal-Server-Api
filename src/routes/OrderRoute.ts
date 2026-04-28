import { Router } from "express";
const router = Router();
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import OrderValidation from "../validations/OrderValidation";
import OrderController from "../controllers/OrderController";
import OrderRedisMiddleware from "../middlewares/OrderRedisMiddleware";
import ProductStockRedisMiddleware from "../middlewares/ProductStockRedisMiddleware";

const orderRedisMiddleware = new OrderRedisMiddleware();
const productStockRedisMiddleware = new ProductStockRedisMiddleware();

router
    .route("/orders")
    .post(
        Auth,
        validate(OrderValidation.create),
        orderRedisMiddleware.clearCache(),
        productStockRedisMiddleware.clearProductStockCache(),
        OrderController.create
    )

router
    .route("/orders/my")
    .get(
        Auth,
        orderRedisMiddleware.getAllCachedOrderData(),
        OrderController.getAll
    );

router
    .route("/orders/verify-payment")
    .post(
        Auth,
        validate(OrderValidation.verifyPayment),
        productStockRedisMiddleware.clearProductStockCache(),
        OrderController.verifyPayment
    );


router
    .route("/orders/details/:id")
    .get(
        Auth,
        orderRedisMiddleware.getCachedOrderDataDetails(),
        OrderController.getOrderDetails
    );


router
    .route("/orders/:id")
    .get(
        Auth,
        orderRedisMiddleware.getCachedOrderData(),
        OrderController.getById
    )
    .put(
        Auth,
        validate(OrderValidation.updateStatus),
        orderRedisMiddleware.clearCache(),
        orderRedisMiddleware.clearIndividualCache(),
        orderRedisMiddleware.clearIndividualCacheDetails(),
        productStockRedisMiddleware.clearProductStockCache(),
        OrderController.updateStatus)


export default router;