import axios from "axios";
import { config } from "../config/index";
import EsewaCredentialsHelper from "../helper/EsewaCredentialsHelper";

interface IPaymentData {
    amount: number;
}

class Payment {
    public static async inititeEsewaPayment(data: IPaymentData) {
        const amount = 100;
        const transaction_uuid =
            EsewaCredentialsHelper.generateUniqueId();
        const message = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${config.ESEWA_MERCHENT_ID}`;

        const signature = EsewaCredentialsHelper.generateHash(
            config.ESEWA_SECRET_KEY as string,
            message
        );

        const payload = {
            amount: amount,
            failure_url: config.PAYMENT_FAILURE_URL,
            success_url: config.PAYMENT_SUCCESS_URL,
            product_delivery_charge: 0,
            product_service_charge: 0,
            product_code: config.ESEWA_MERCHENT_ID,
            total_amount: amount,
            signature: signature,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            tax_amount: 0,
            transaction_uuid: transaction_uuid,
        };

        try {
            const response = await axios.post(
                config.ESEWA_PAYMENT_INITIATE_URL as string,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                success: true,
                data: response.data,
                transaction_uuid,
            };
        } catch (error: any) {
            console.error("eSewa Error:", error?.response?.data || error.message);

            throw new Error(
                error?.response?.data?.message || "Payment initiation failed"
            );
        }
    }
}

export default Payment;