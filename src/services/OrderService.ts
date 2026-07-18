import sequelize from "../config/database";
import AvailableStockHelper from "../helper/AvaliableStockHelper";
import ActualStock from "../models/ActualStockMode";
import Farm from "../models/FarmModel";
import Notification from "../models/NotificationModel";
import OrderItem from "../models/OrderItemModel";
import Order, { OrderStatus } from "../models/OrderModel";
import Payment, { PaymentMethod, PaymentStatus } from "../models/PaymentModel";
import Product from "../models/ProductModel";
import Stock, { comesFrom } from "../models/StockModel";
import VendorOrder from "../models/VendorOrder";
import redisClient from "../redis/redis";
import { NotFoundError } from "../utils/errors";
import { QueryTypes, Sequelize } from "sequelize";

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

export interface OrderRseponseType {
    totalAmount: number;
    farmerIds: Array<number>;
    orderId: number;
    userId: number;
    success: boolean
}

class OrderService {

    static async createOrder(data: CreateOrderDTO): Promise<OrderRseponseType> {
        const t = await sequelize.transaction();

        try {
            let totalAmount = data.items.reduce((total, item) => {
                const price = Number(item.rate);
                const quantity = Number(item.quantity);
                const subtotal = price * quantity;
                return total + subtotal;
            }, 0);

            const farmerIds = new Set<number>();


            const order = await Order.create({
                userId: data.customerId,
                totalAmount: totalAmount,
                status: OrderStatus.PENDING,
                paymentStatus: PaymentStatus.PENDING,
                paymentMethod: data.paymentMethod,
                address: data.address,
                gatewayReferenceId: ""

            }, { transaction: t });

            const farmerWiseTotals = new Map<
                number,
                {
                    totalAmount: number;
                    farmerId: number;
                    items: typeof data.items;
                }
            >();

            for (const item of data.items) {
                const product = await Product.findByPk(item.productId, {
                    transaction: t
                });
                if (!product) {
                    throw new NotFoundError("Product not found");
                }
                const farmId = product.farmId;
                const farmerId = product.farmerId;
                farmerIds.add(farmerId);
                const totalAmount = item.rate * item.quantity;

                if (!farmerWiseTotals.has(farmId)) {
                    farmerWiseTotals.set(farmId, {
                        totalAmount: 0,
                        farmerId: farmerId,
                        items: []
                    });
                }
                const farmerData = farmerWiseTotals.get(farmId)!;
                farmerData.totalAmount += totalAmount;
                farmerData.items.push(item);
            }

            for (const [farmId, farmerData] of farmerWiseTotals) {
                const totalAmount = farmerData.totalAmount;
                const items = farmerData.items;
                const farmerId = farmerData.farmerId;
                const vendorOrder = await VendorOrder.create({
                    orderId: order.id,
                    totalAmount,
                    farmId,
                    userId: data.customerId,
                    isActive: true
                }, { transaction: t });

                for (const item of items) {
                    const price = Number(item.rate);
                    const quantity = Number(item.quantity);
                    const subtotal = price * quantity;

                    await OrderItem.create({
                        orderId: order.id,
                        productId: item.productId,
                        price,
                        quantity,
                        subtotal,
                        farmId: farmId,
                        userId: data.customerId,
                        vendorOrderId: vendorOrder.id
                    }, { transaction: t });
                    const availableStock = await AvailableStockHelper.getAvailableStock(item.productId);

                    if (availableStock < quantity) {
                        t.rollback();
                        throw new Error("Insufficient stock");
                    }
                    if (data.paymentMethod === PaymentMethod.COD) {
                        await ActualStock.increment(
                            {
                                sales: quantity
                            },
                            {
                                where: {
                                    productId: item.productId
                                },
                                transaction: t
                            }
                        );

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
                            farmId: farmId,
                            createdBy: data.customerId,
                            tableId: order.id,
                            comesFrom: comesFrom.SALES,
                            reserveQuantity: 0
                        }, { transaction: t });
                    } else {
                        await ActualStock.increment(
                            {
                                reserveQuantity: quantity
                            },
                            {
                                where: {
                                    productId: item.productId
                                },
                                transaction: t
                            }
                        );

                        await Stock.create({
                            productId: item.productId,
                            openingStock: 0,
                            sales: 0,
                            salesReturn: 0,
                            damage: 0,
                            chalan: 0,
                            chalanReturn: 0,
                            rate: price,
                            amount: subtotal,
                            farmId: farmId,
                            createdBy: data.customerId,
                            tableId: order.id,
                            comesFrom: comesFrom.RESERVE,
                            reserveQuantity: quantity
                        }, { transaction: t });
                    }

                }
                await Notification.create({
                    userId: farmerId,
                    title: "New Order",
                    message: `You received a new order #${order.id}`,
                    type: "ORDER",
                    meta: {
                        orderId: order.id
                    }
                }, { transaction: t });

            }

            await Payment.create({
                orderId: order.id,
                amount: totalAmount,
                paymentMethod: data.paymentMethod,
                status: PaymentStatus.PENDING,
                userId: data.customerId,
            }, { transaction: t });

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
                totalAmount,
                success: true
            };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async updateOrderAfterPaymentSuccess(gatewayReferenceId: string, paymentStatus: PaymentStatus): Promise<OrderRseponseType> {
        const transaction = await sequelize.transaction();
        try {
            const [order, payment] = await Promise.all([
                await Order.findOne({
                    where: { gatewayReferenceId: gatewayReferenceId }
                }),
                await Payment.findOne({
                    where: { gatewayReferenceId: gatewayReferenceId }
                })
            ])

            if (!order) throw new NotFoundError("Order not found");
            if (!payment) throw new NotFoundError("Payment not found");

            const orderItems = await OrderItem.findAll({
                where: { orderId: order.id },
                transaction
            })

            order.status = OrderStatus.CONFIRMED;
            payment.status = PaymentStatus.PAID;

            const farmerIds = new Set<number>();
            await Promise.all([
                order.save({ transaction }),
                payment.save({ transaction }),

                ...orderItems.map(async (item) => {
                    let sales = 0;

                    if (paymentStatus === PaymentStatus.PAID) {
                        sales = item.quantity;
                    }

                    const product = await Product.findByPk(item.productId, {
                        transaction
                    });

                    if (!product) {
                        throw new NotFoundError("Product not found");
                    }
                    farmerIds.add(product.farmerId);

                    await ActualStock.increment(
                        {
                            reserveQuantity: -item.quantity,
                            sales
                        },
                        {
                            where: {
                                productId: item.productId
                            },
                            transaction
                        }
                    );

                    if (sales > 0) {
                        await Stock.create(
                            {
                                productId: item.productId,
                                openingStock: 0,
                                sales: item.quantity,
                                salesReturn: 0,
                                damage: 0,
                                chalan: 0,
                                chalanReturn: 0,
                                rate: item.price,
                                amount: item.subtotal,
                                farmId: product.farmId,
                                createdBy: order.userId,
                                tableId: order.id,
                                comesFrom: comesFrom.SALES,
                                reserveQuantity: 0
                            },
                            { transaction }
                        );
                    }
                })
            ]);
            for (const farmerId of farmerIds) {
                await Notification.create(
                    {
                        userId: farmerId,
                        title: "New Order",
                        message: `You received a new order #${order.id}`,
                        type: "ORDER",
                        meta: {
                            orderId: order.id
                        }
                    },
                    { transaction }
                );
            }

            await Notification.create(
                {
                    userId: order.userId,
                    title: "Order Placed",
                    message: `Your order #${order.id} has been placed successfully`,
                    type: "ORDER",
                    meta: {
                        orderId: order.id
                    }
                },
                { transaction }
            );
            await transaction.commit();
            return {
                farmerIds: Array.from(farmerIds),
                orderId: order.id,
                totalAmount: order.totalAmount,
                userId: order.userId,
                success: true
            }
        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    }
    static async getOrderDetailsForUser(id: number) {

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
                    model: VendorOrder,
                    as: "vendorOrders",

                    attributes: [
                        "id",
                        "totalAmount",
                        "farmId"
                    ],

                    include: [
                        {
                            model: Farm,
                            as: "farm",
                            attributes: ["farmName"]
                        },

                        {
                            model: OrderItem,
                            as: "orderItems",

                            attributes: [
                                "id",
                                "productId",
                                "quantity",
                                "price",
                                "subtotal"
                            ],

                            include: [
                                {
                                    model: Product,
                                    as: "product",
                                    attributes: ["name", "image"]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        return order;
    }

    static async getOrderDetailsForAdmin(farmId: number, orderId: number) {

        const orders = await VendorOrder.findOne({
            where: {
                id: orderId,
                farmId
            },

            attributes: [
                "id",
                "totalAmount",
                "createdAt",
                "paymentStatus",
                "status"
            ],

            include: [
                {
                    model: Order,
                    as: "order",
                    attributes: [
                        "address",
                        "paymentMethod",
                        "paymentStatus",
                        "status",
                    ],
                },

                {
                    model: OrderItem,
                    as: "orderItems",
                    attributes: [
                        "id",
                        "productId",
                        "quantity",
                        "price",
                        "subtotal",
                    ],
                    include: [
                        {
                            model: Product,
                            as: "product",
                            attributes: [
                                "name",
                                "image",
                            ],
                        }
                    ]
                }
            ],
        });

        if (!orders) return null;

        return {
            id: orders.id,
            totalAmount: orders.totalAmount,
            createdAt: orders.createdAt,

            address: orders.order?.address,
            paymentMethod: orders.order?.paymentMethod,
            paymentStatus: orders.paymentStatus,
            status: orders.status,

            products: orders.orderItems.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product?.name,
                productImage: item.product?.image,
                quantity: Number(item.quantity),
                price: Number(item.price),
                subtotal: Number(item.subtotal),
            })),
        };
    }


    static async getOrderDetailsForSuperAdmin(orderId: number) {

        const order = await Order.findOne({
            where: { id: orderId },
            attributes: [
                "id",
                "totalAmount",
                "address",
                "paymentMethod",
                "paymentStatus",
                "status",
                "createdAt",
            ],

            include: [
                {
                    model: VendorOrder,
                    as: "vendorOrders",
                    required: false,
                    where: { orderId }, // ensure vendor orders belong to this order
                    attributes: [
                        "id",
                        "farmId",
                        "totalAmount",
                        "paymentStatus",
                        "status",
                        "createdAt",
                    ],
                    include: [
                        {
                            model: Farm,
                            as: "farm",
                            attributes: ["id", "farmName"],
                        },
                        {
                            model: OrderItem,
                            as: "orderItems",
                            required: false,
                            // enforce BOTH keys match, not just vendorOrderId
                            where: Sequelize.where(
                                Sequelize.col("vendorOrders->orderItems.orderId"),
                                orderId
                            ),
                            attributes: [
                                "id",
                                "productId",
                                "orderId",
                                "vendorOrderId",
                                "quantity",
                                "price",
                                "subtotal",
                            ],
                            include: [
                                {
                                    model: Product,
                                    as: "product",
                                    attributes: ["name", "image"],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!order) return null;

        return {
            id: order.id,
            totalAmount: order.totalAmount,
            address: order.address,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            status: order.status,
            createdAt: order.createdAt,

            vendors: order.vendorOrders.map((vendorOrder: any) => ({
                vendorOrderId: vendorOrder.id,
                farmId: vendorOrder.farmId,
                farmName: vendorOrder.farm?.farmName,
                totalAmount: Number(vendorOrder.totalAmount),
                paymentStatus: vendorOrder.paymentStatus,
                status: vendorOrder.status,
                createdAt: vendorOrder.createdAt,

                products: vendorOrder.orderItems.map((item: any) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product?.name,
                    productImage: item.product?.image,
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    subtotal: Number(item.subtotal),
                })),
            })),
        };
    }
    static async getOrderDetails(id: number) {
        const orderItems = await OrderItem.findAll({
            where: { orderId: id },
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
        });

        const formattedItems = orderItems.map(item => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            subtotal: item.subtotal,
            price: item.price,
            farmId: item.farmId,
            productName: item.product?.name,
            farmName: item.farm?.farmName
        }));

        await redisClient.hset(`order:details`,
            id.toString(), JSON.stringify(formattedItems));

        await redisClient.expire(`order:details`, 300);
        return formattedItems;
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
            order: [["createdAt", "DESC"]]
        });

        await redisClient.set(`user:${userId}:orders`, JSON.stringify(orders));

        return orders;
    }

    static async getAllAdminOrders(farmId?: number) {
        if (farmId) {
            const result = await sequelize.query(
                `
                SELECT 
                    a.id,
                    a.address,
                    a.paymentMethod,
                    b.paymentStatus,
                    a.paymentMethod,
                    b.status,
                    b.totalAmount,
                    a.createdAt
                FROM orders a
                INNER JOIN vendor_orders b ON a.id = b.orderId
                WHERE b.farmId = :farmId
                ORDER BY b.createdAt DESC
                `,
                {
                    replacements: { farmId },
                    type: QueryTypes.SELECT,
                }
            );

            return result;

        }

        // no farmId → pull everything directly from Order
        const orders = await Order.findAll({
            attributes: [
                "id",
                "totalAmount",
                "address",
                "paymentMethod",
                "paymentStatus",
                "status",
                "createdAt",
            ],

            order: [["createdAt", "DESC"]],
            raw: true,
        });

        return orders;
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
            ]
        });

        if (!order) throw new NotFoundError("Order not found");

        await redisClient.hset(
            "orders",
            id.toString(),
            JSON.stringify(order)
        );

        await redisClient.expire("orders", 300);

        return order;
    }

    static async updateGateWayReference(id: number, referenceId: string) {
        const order = await Order.findByPk(id);
        if (!order) throw new NotFoundError("Order not found");
        const t = await sequelize.transaction();
        try {
            await order.update({ gatewayReferenceId: referenceId }, { transaction: t });
            await Payment.update(
                {
                    gatewayReferenceId: referenceId
                }, {
                where: {
                    orderId: id
                },
                transaction: t
            }
            )
            await t.commit();
        } catch (e) {
            await t.rollback();
            throw e;
        }
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

                await ActualStock.increment(
                    {
                        salesReturn: item.quantity
                    },
                    {
                        where: {
                            productId: item.productId
                        },
                        transaction: t
                    }
                );

                await Stock.create({
                    productId: item.productId,
                    openingStock: 0,
                    sales: 0,
                    salesReturn: item.quantity,
                    damage: 0,
                    chalan: 0,
                    chalanReturn: 0,
                    rate: item.rate,
                    amount: item.amount,
                    farmId: item.farmId,
                    createdBy: item.createdBy,
                    tableId: order.id,
                    comesFrom: comesFrom.RESERVE,
                    reserveQuantity: 0
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

    static async updateOrderStatusByFarmer(id: number, farmId: number, status: OrderStatus) {
        const order = await VendorOrder.findOne({
            where: {
                orderId: id,
                farmId
            }

        });
        if (!order) throw new NotFoundError("Order not found");

        await order.update({ status });

        const allOrders = await VendorOrder.findAll({
            where: {
                orderId: id,
            },
            attributes: ["status"],
        });

        // Check if every order has the same status
        const allSameStatus = allOrders.every(
            (o) => o.status === allOrders[0].status
        );

        if (allSameStatus) {
            const parentOrder = await Order.findByPk(id);

            if (parentOrder) {
                await parentOrder.update({ status });
            }
        }

        // if(status === OrderStatus.CANCELLED) {
        //     this.cancelOrder(id);
        // }
        return order;
    }

    static async updateOrderPaymentStatus(id: number, farmId: number, status: PaymentStatus) {
        try {
            const order = await VendorOrder.findOne({
                where: {
                    orderId: id,
                    farmId
                }

            });
            if (!order) throw new NotFoundError("Order not found");

            console.log(order);

            await order.update({ paymentStatus: status });

            const allOrders = await VendorOrder.findAll({
                where: {
                    orderId: id,
                },
                attributes: ["paymentStatus"],
            });

            // Check if every order has the same status
            const allSameStatus = allOrders.every(
                (o) => o.paymentStatus === allOrders[0].paymentStatus
            );

            if (allSameStatus) {
                const parentOrder = await Order.findByPk(id);

                if (parentOrder) {
                    await parentOrder.update({ paymentStatus: status });
                }
            }

            // if(status === OrderStatus.CANCELLED) {
            //     this.cancelOrder(id);
            // }
            return order;
        } catch (error) {
            throw error
        }
    }
}

export default OrderService;