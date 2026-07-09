import { Request, Response } from "express";
import PaymentManagementService from "../services/PaymentManagementService";
import AuthService from "../services/auth/AuthService";
import { AuthRequest } from "../middlewares/Auth";
class PaymentManagementController {

    static async createPaymentMethod(req: AuthRequest, res: Response) {
        try {
            const {
                vendorId,
                amount,
                paymentMethod,
                remarks
            } = req.body;
            const farmer: any = await AuthService.getFarmerDetailsFromFarmId(vendorId)
            const createdBy = req.user!.id;
            const userId = farmer?.user_id;

            const paymentObject = {
                farmId:vendorId,
                amount,
                paymentMethod,
                remarks,
                createdBy,
                user: userId
            }

            const payment = await PaymentManagementService.cretaePayment(paymentObject);
            return res.status(201).json({
                status: true,
                message: "Payment method created successfully"
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