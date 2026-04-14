import Router from "express";
import Payment from "../middlewares/Payment";
const router = Router();


router
    .route("/initite-esewa-payment")
    .post(
        Payment.inititeEsewaPayment);


export default router;