import sequelize from "../config/database";
import Notification from "../models/NotificationModel";
import OrderItem from "../models/OrderItemModel";
import Order, { OrderStatus } from "../models/OrderModel";
import Payment, { PaymentMethod, PaymentStatus } from "../models/PaymentModel";
import Product from "../models/ProductModel";
import Stock from "../models/StockModel";
import { NotFoundError } from "../utils/errors";

interface CreateOrderDTO {
    customerId: number;
    items: {
        productId: number;
        quantity: number;
        rate: number;
        farmId: number;
    }[];
    paymentMethod: PaymentMethod;
}

class OrderService {

    static async createOrder(data: CreateOrderDTO) {
        const t = await sequelize.transaction();
        console.log(data);

        try {
            let totalAmount = data.items.reduce((total, item) => {
                const price = Number(item.rate);
                const quantity = Number(item.quantity);
                const subtotal = price * quantity;
                return total + subtotal;
            }, 0);
            const order = await Order.create({
                userId: data.customerId,
                totalAmount: totalAmount,
                status: OrderStatus.PENDING
            }, { transaction: t });

            let farmerIds = new Set<number>();
            for (const item of data.items) {

                const product = await Product.findByPk(item.productId, { transaction: t });

                if (!product) { throw new NotFoundError("Product not found"); }

                farmerIds.add(product.farmerId);

                const price = Number(item.rate);
                const quantity = Number(item.quantity);
                const subtotal = price * quantity;

                await OrderItem.create({
                    orderId: order.id,
                    productId: item.productId,
                    price,
                    quantity,
                    subtotal,
                    farmId: item.farmId,
                    userId: data.customerId
                }, { transaction: t });

                await Stock.create({
                    productId: item.productId,
                    openingStock: 0,
                    sales: quantity,
                    salesReturn: 0,
                    damage: 0,
                    chalan: 0,
                    chalanReturn: 0,
                    rate: price,
                    amount: subtotal,
                    farmId: item.farmId,
                    createdBy: data.customerId
                }, { transaction: t });
            }
            await Payment.create({
                orderId: order.id,
                amount: totalAmount,
                paymentMethod: data.paymentMethod,
                status: PaymentStatus.PENDING,
                userId: data.customerId,
            }, { transaction: t });

            for (const farmer of farmerIds) {
                await Notification.create({
                    userId: farmer,
                    title: "New Order",
                    message: `You received a new order #${order.id}`,
                    type: "ORDER",
                    meta: {
                        orderId: order.id
                    }
                }, { transaction: t });

            }

            await Notification.create({
                userId: data.customerId,
                title: "Order Placed",
                message: `Your order #${order.id} has been placed successfully`,
                type: "ORDER",
                meta: {
                    orderId: order.id
                }
            }, { transaction: t });
            await t.commit();
            return order;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getAllOrders(userId: number) {
        return await Order.findAll({
            where: { customerId: userId },
            include: [
                { model: OrderItem, include: [Product] },
                { model: Payment }
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    static async getOrderById(id: number) {
        const order = await Order.findByPk(id, {
            include: [
                { model: OrderItem, include: [Product] },
                { model: Payment }
            ],
        });

        if (!order) throw new NotFoundError("Order not found");

        return order;
    }

    static async updateOrderStatus(id: number, status: string) {
        const order = await Order.findByPk(id);

        if (!order) throw new NotFoundError("Order not found");

        await order.update({ status });

        return order;
    }

    static async deleteOrder(id: number) {
        const t = await sequelize.transaction();

        try {
            const order = await Order.findByPk(id, {
                include: [OrderItem],
                transaction: t
            });

            if (!order) throw new NotFoundError("Order not found");

            for (const item of order.items) {
                const stock = await Stock.findOne({
                    where: {
                        productId: item.productId,
                        farmId: item.farmId
                    },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                if (stock) {
                    await stock.update({
                        openingStock: Number(stock.openingStock) + Number(item.quantity),
                        sales: Number(stock.sales) - Number(item.quantity),
                    }, { transaction: t });
                }
            }

            await order.update({ status: "cancelled" }, { transaction: t });

            await Payment.update(
                { status: PaymentStatus.FAILED },
                { where: { orderId: id }, transaction: t }
            );

            await t.commit();
            return true;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

export default OrderService;