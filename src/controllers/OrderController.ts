import { Response, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/Auth";
import OrderService, { OrderRseponseType } from "../services/OrderService";
import { sendNotificationToUser } from "../socket/socket";
import { PaymentMethod, PaymentStatus } from "../models/PaymentModel";
import Payment from "../middlewares/Payment";

class OrderController {

    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const order: OrderRseponseType = await OrderService.createOrder({
            customerId: req.user!.id,
            items: req.body.items,
            paymentMethod: req.body.paymentMethod,
            address: req.body.address
        });

        const totalAmount = Number(order.totalAmount);

        switch (req.body.paymentMethod) {
            case PaymentMethod.COD:
                if (order.success) {
                    order.farmerIds.forEach((farmerId: number) => {
                        sendNotificationToUser(
                            farmerId.toString(),
                            "newOrder",
                            {
                                userId: farmerId,
                                title: "New Order",
                                message: `You received a new order #${order.orderId}`,
                                type: "ORDER"
                            }
                        );
                    });

                    sendNotificationToUser(
                        order.userId.toString(),
                        "orderPlaced",
                        {
                            userId: order.userId,
                            title: "Order Placed",
                            message: `Your order #${order.orderId} has been placed successfully`,
                            type: "ORDER"
                        }
                    );

                }
                return res.status(201).json({
                    status: true,
                    message: "COD Order created successfully"
                });

            case PaymentMethod.KHALTI:
                const khaltiResponse = await Payment.inititeKhaltiPayment(totalAmount);
                await OrderService.updateGateWayReference(order.orderId, khaltiResponse.pidx);
                await OrderService.updateGateWayReference(order.orderId, khaltiResponse.pidx);
                return res.status(200).json({
                    status: true,
                    message: "Khalti Payment Initiated",
                    url: khaltiResponse.payment_url
                });
            case PaymentMethod.ESEWA:
                const esewaResponse = await Payment.inititeEsewaPayment(totalAmount);
                await OrderService.updateGateWayReference(order.orderId, esewaResponse.transaction_uuid);
                return res.status(201).json(
                    {
                        status: true,
                        message: "Esewa Payment Initiated", esewaResponseForm: esewaResponse.formHtml
                    }
                );

            default:
                return res.status(400).json({
                    status: false,
                    message: "Invalid payment method"
                });
        }
    });

    static verifyPayment = asyncHandler(async (req: Request, res: Response) => {
        const gatewayReferenceId = req.body.gatewayReferenceId;
        const paymentMethod = req.body.paymentMethod;
        const amount = req.body.amount;
        let paymentStatus = PaymentStatus.PENDING;
        let verificationResponse: any = null;

        if (paymentMethod == PaymentMethod.KHALTI) {
            verificationResponse = await Payment.verifyKhaltiPayment(gatewayReferenceId);
            if (verificationResponse) {
                paymentStatus = PaymentStatus.PAID;
            }
        } else if (paymentMethod == PaymentMethod.ESEWA) {
            verificationResponse = await Payment.verifyEsewaPayment(gatewayReferenceId, amount);
            if (verificationResponse) {
                paymentStatus = PaymentStatus.PAID;
            }
        }
        const order = await OrderService.updateOrderAfterPaymentSuccess(gatewayReferenceId, paymentStatus);
        if (order.success) {
            order.farmerIds.forEach((farmerId: number) => {
                sendNotificationToUser(
                    farmerId.toString(),
                    "newOrder",
                    {
                        userId: farmerId,
                        title: "New Order",
                        message: `You received a new order #${order.orderId}`,
                        type: "ORDER"
                    }
                );
            });

            sendNotificationToUser(
                order.userId.toString(),
                "orderPlaced",
                {
                    userId: order.userId,
                    title: "Order Placed",
                    message: `Your order #${order.orderId} has been placed successfully`,
                    type: "ORDER"
                }
            );

        }
        return res.status(200).json({
            status: true,
            message: "Payment verified successfully",
        });
    });

    static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
        const orders = await OrderService.getAllOrders(req.user!.id);
        res.status(200).json({ status: true, data: orders });
    });

    static getOrderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);
        const orders = await OrderService.getOrderDetails(id);
        res.status(200).json({ status: true, data: orders });
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const order = await OrderService.getOrderById(Number(req.params.id));
        res.status(200).json(
            {
                status: true,
                message: "Order fetched successfully",
                data: order
            }
        );
    });

    static updateStatus = asyncHandler(async (req: Request, res: Response) => {
        await OrderService.updateOrderStatus(
            Number(req.params.id),
            req.body.status
        );

        res.status(200).json({
            status: true,
            message: "Order status updated"
        });
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        await OrderService.deleteOrder(Number(req.params.id));

        res.status(200).json({
            status: true,
            message: "Order cancelled successfully"
        });
    });
}

export default OrderController;