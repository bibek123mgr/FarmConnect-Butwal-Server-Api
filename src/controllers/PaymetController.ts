import { Request, Response } from "express";
import Payment, { IEsewaInitializeResponse } from "../middlewares/Payment";

class PaymentController {
    static async inititeEsewaPayment(req: Request, res: Response) {
        const amount = 100;

        const result: IEsewaInitializeResponse =
            await Payment.inititeEsewaPayment({
                amount
            });
        const formHtml = result.formHtml;
        // const transaction_uuid = result.transaction_uuid;

        // console.log("Transaction:", transaction_uuid);

        res.setHeader("Content-Type", "text/html");
        res.send(formHtml);
    }
}

export default PaymentController;