import axios from "axios";
import { config } from "../config/index";
import EsewaCredentialsHelper from "../helper/EsewaCredentialsHelper";

interface IPaymentData {
    amount: number;
}

export interface IEsewaInitializeResponse {
    formHtml: string;
    transaction_uuid: string;
}


class Payment {
    public static async inititeEsewaPayment(amount: number): Promise<IEsewaInitializeResponse> {

        const transaction_uuid = EsewaCredentialsHelper.generateUniqueId();
        const message = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${config.ESEWA_MERCHENT_ID}`;
        const signature = EsewaCredentialsHelper.generateHash(
            config.ESEWA_SECRET_KEY as string,
            message
        );

        const payload = {
            amount,
            tax_amount: 0,
            total_amount: amount,
            transaction_uuid,
            product_code: config.ESEWA_MERCHENT_ID,
            product_service_charge: 0,
            product_delivery_charge: 0,
            success_url: config.PAYMENT_SUCCESS_URL,
            failure_url: config.PAYMENT_FAILURE_URL,
            signed_field_names: "total_amount,transaction_uuid,product_code",
            signature,
        };

        const formHtml = `
        <html>
        <body onload="document.forms[0].submit()">
            <form action="${config.ESEWA_PAYMENT_INITIATE_URL}" method="POST">
                ${Object.entries(payload)
                .map(([key, value]) =>
                    `<input type="hidden" name="${key}" value="${value}" />`
                )
                .join("")}
            </form>
        </body>
        </html>
        `;
        return { transaction_uuid, formHtml };
    }

    public static async verifyEsewaPayment(transaction_uuid: string, amount: number) {
        try {
            const payload = {
                transaction_uuid: transaction_uuid,
                total_amount: amount,
                product_code: config.ESEWA_MERCHENT_ID
            }
            const response = await axios.get(
                config.ESEWA_PAYMENT_STATUS_CHECK_URL as string,
                {
                    params: payload,
                }
            );

            return response.data?.status === "SUCCESS";
        } catch (error: any) {
            console.error("eSewa Error:", error?.response?.data || error.message);
            throw new Error(
                error?.response?.data?.message || "Payment verification failed"
            );
        }
    }

    public static async inititeKhaltiPayment(amount: number) {
        const purchase_order_id =
            EsewaCredentialsHelper.generateUniqueId();
        const payload = {
            "amount": amount * 100,
            "return_url": config.PAYMENT_SUCCESS_URL,
            "website_url": config.FRONTEND_URL,
            "purchase_order_id": purchase_order_id,
            "purchase_order_name": "test",
            // "customer_info": {
            //     "name": "Ram Bahadur",
            //     "email": "test@khalti.com",
            //     "phone": "9800000001"
            // }
        };

        try {
            const response = await axios.post(
                config.KHALTI_PAYMENT_INITIATE_URL as string,
                payload,
                {
                    headers: {
                        "Authorization": `Key ${config.KHALTI_SECRET_KEY as string}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            return {
                success: true,
                pidx: response.data.pidx,
                payment_url: response.data.payment_url,
                expires_at: response.data.expires_at,
                expires_in: response.data.expires_in,
                purchase_order_id,
            };
        } catch (error: any) {
            console.error("Khalti Error:", error?.response?.data || error.message);
            throw new Error(
                error?.response?.data?.message || error.message || "Payment initiation failed"
            );
        }
    }

    public static async verifyKhaltiPayment(pidx: string): Promise<Boolean> {
        try {
            const payload = {
                "pidx": pidx
            }
            const response = await axios.post(
                config.KHALTI_PAYMENT_STATUS_CHECK_URL as string,
                payload,
                {
                    headers: {
                        "Authorization": `Key ${config.KHALTI_SECRET_KEY as string}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            return response.data?.status == "Completed";

        } catch (error: any) {
            console.error("Khalti Error:", error?.response?.data || error.message);
            throw new Error(
                error?.response?.data?.message || "Payment verification failed"
            );
        }
    }
}

export default Payment;