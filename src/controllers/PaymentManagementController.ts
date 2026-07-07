import { Request, Response } from "express";
import PaymentManagementService from "../services/PaymentManagementService";
class PaymentManagementController {

    // static async getPaymentMethods(req:Request, res:Response) {
    //     try {
    //         const paymentMethods = await PaymentManagementService.getAllPayment();
    //         return res.status(200).json({
    //             status: true,
    //             message: "Payment methods fetched successfully",
    //             data: paymentMethods,
    //         });
    //     } catch (error) {
    //         return res.status(500).json({
    //             status: false,
    //             message: "Error fetching payment methods",
    //             error: error.message,
    //         });
    //     }
    // }

    static async createPaymentMethod(req: Request, res: Response) {
        try {
            const paymentMethod = await PaymentManagementService.cretaePayment(req.body);
            return res.status(201).json({
                status: true,
                message: "Payment method created successfully",
                data: paymentMethod,
            });
        } catch (error) {
            return res.status(500).json({
                status: false,
                message: "Error creating payment method"
            });
        }
    }
}

export default PaymentManagementController;