import { Response, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/Auth";
import OrderService from "../services/OrderService";
import { sendNotificationToUser } from "../socket/socket";

class OrderController {

    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const order = await OrderService.createOrder({
            customerId: req.user!.id,
            items: req.body.items,
            paymentMethod: req.body.paymentMethod,
            address: req.body.address
        });
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
        res.status(201).json({ status: true, message: "Order created successfully" });
    });

    static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
        const orders = await OrderService.getAllOrders(req.user!.id);
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