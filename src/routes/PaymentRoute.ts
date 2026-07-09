import { Router } from "express";
import { Auth } from "../middlewares/Auth";
const router = Router();
import paymentController from "../controllers/PaymentManagementController";


router.route("/payments")
    .post(
        Auth,
        paymentController.createPaymentMethod
    );


export default router