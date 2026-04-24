import sequelize from "../config/database";
import Farm from "../models/FarmModel";
import Notification from "../models/NotificationModel";
import OrderItem from "../models/OrderItemModel";
import Order, { OrderStatus } from "../models/OrderModel";
import Payment, { PaymentMethod, PaymentStatus } from "../models/PaymentModel";
import Product from "../models/ProductModel";
import Stock, { comesFrom } from "../models/StockModel";
import { NotFoundError } from "../utils/errors";
import { Sequelize } from "sequelize";

interface CreateOrderDTO {
    customerId: number;
    items: {
        productId: number;
        quantity: number;
        rate: number;
        farmId: number;
    }[];
    paymentMethod: PaymentMethod;
    address: string
}

class OrderService {

    static async createOrder(data: CreateOrderDTO) {
        const t = await sequelize.transaction();

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
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                paymentMethod: data.paymentMethod,
                address: data.address
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
                    createdBy: data.customerId,
                    tableId: order.id,
                    comesFrom: comesFrom.SALES
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
            return {
                farmerIds: Array.from(farmerIds),
                orderId: order.id,
                userId: data.customerId,
                success: true
            };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getAllOrders(userId: number) {
        const orders = await Order.findAll({
            where: { userId },
            attributes: [
                "id",
                "totalAmount",
                "address",
                "paymentMethod",
                "paymentStatus",
                "status",
                "createdAt"
            ],
            include: [
                {
                    model: OrderItem,
                    as: "items",
                    attributes: [
                        "id",
                        "productId",
                        "quantity",
                        "subtotal",
                        "price",
                        "farmId"
                    ],
                    include: [
                        {
                            model: Product,
                            attributes: ["name"]
                        },
                        {
                            model: Farm,
                            attributes: ["farmName"]
                        }
                    ]
                }
            ],
            order: [["createdAt", "DESC"]]
        });

        return orders.map(order => {
            const o = order.toJSON();

            o.items = o.items.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                subtotal: item.subtotal,
                price: item.price,
                farmId: item.farmId,
                productName: item.product?.name,
                farmName: item.farm?.farmName
            }));

            return o;
        });
    }

    static async getOrderById(id: number) {
        const order = await Order.findByPk(id, {
            attributes: [
                "id",
                "totalAmount",
                "address",
                "paymentMethod",
                "paymentStatus",
                "status",
                "createdAt"
            ],
            include: [
                {
                    model: OrderItem,
                    as: "items",
                    attributes: [
                        "id",
                        "productId",
                        "quantity",
                        "subtotal",
                        "price",
                        "farmId"
                    ],
                    include: [
                        {
                            model: Product,
                            attributes: ["name"]
                        },
                        {
                            model: Farm,
                            attributes: ["farmName"]
                        }
                    ]
                }
            ]
        });

        if (!order) throw new NotFoundError("Order not found");

        const o = order.toJSON();

        o.items = o.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            subtotal: item.subtotal,
            price: item.price,
            farmId: item.farmId,
            productName: item.product?.name,
            farmName: item.farm?.farmName
        }));

        return o;
    }

    static async updateOrderStatus(id: number, status: OrderStatus) {
        if (status === OrderStatus.CANCELLED) {
            return await this.cancelOrder(id);
        }

        const order = await Order.findByPk(id);
        if (!order) throw new NotFoundError("Order not found");

        await order.update({ status });

        await Notification.create({
            userId: order.userId,
            title: "Order Update",
            message: `Your order #${order.id} is now ${status}.`,
            type: "ORDER",
            meta: {
                orderId: order.id
            }
        });

        return order;
    }

    private static async cancelOrder(id: number) {
        const order = await Order.findByPk(id);

        if (!order) throw new NotFoundError("Order not found");
        const t = await sequelize.transaction();
        try {
            await order.update(
                {
                    isActive: false,
                    status: OrderStatus.CANCELLED
                },
                { transaction: t }
            );

            const orderItems = await OrderItem.findAll({
                where: { orderId: id },
                attributes: [
                    "id",
                    [Sequelize.col("farm.userId"), "farmUserId"]
                ],
                include: [{
                    model: Farm,
                    attributes: []
                }],
                transaction: t,
                raw: true
            }) as any[];

            for (const item of orderItems) {
                await Notification.create({
                    userId: item?.farmUserId,
                    title: "Order Cancelled",
                    message: `Your order #${item.id} was cancelled`,
                    type: "ORDER",
                    meta: {
                        orderId: id,
                        orderItemId: item.id
                    }
                }, { transaction: t });
            }

            await Notification.create({
                userId: order.userId,
                title: "Order Cancelled",
                message: `Your order #${id} was cancelled`,
                type: "ORDER",
                meta: {
                    orderId: id
                }
            }, { transaction: t });

            await OrderItem.update(
                {
                    isActive: false,
                },
                {
                    where: { orderId: id },
                    transaction: t
                }
            );

            await Stock.update(
                {
                    isActive: false,
                },
                {
                    where: {
                        tableId: id,
                        comesFrom: comesFrom.SALES,
                    },
                    transaction: t
                }
            );

            await Payment.update(
                { isActive: false },
                { where: { orderId: id }, transaction: t }
            );

            await t.commit();
            return order;

        } catch (error) {
            await t.rollback();
            throw error;
        }
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