import { Router } from "express";
const router = Router();
import { Auth } from "../middlewares/Auth";
import { validate } from "../utils/validation.middleware";
import OrderValidation from "../validations/OrderValidation";
import OrderController from "../controllers/OrderController";

router
    .route("/orders")
    .post(Auth, validate(OrderValidation.create), OrderController.create)
    .get(Auth, OrderController.getAll);

router
    .route("/orders/:id")
    .get(Auth, OrderController.getById)
    .put(Auth, validate(OrderValidation.updateStatus), OrderController.updateStatus)


export default router;