import Router from "express";
import Payment from "../middlewares/Payment";
const router = Router();


router
    .route("/initite-esewa-payment")
    .post(
        Payment.inititeEsewaPayment);

router
    .route("/verify-esewa-payment")
    .post(
        Payment.verifyEsewaPayment);

router
    .route("/initite-khalti-payment")
    .post(
        Payment.inititeKhaltiPayment);

router
    .route("/verify-khalti-payment")
    .post(
        Payment.verifyKhaltiPayment);



export default router;