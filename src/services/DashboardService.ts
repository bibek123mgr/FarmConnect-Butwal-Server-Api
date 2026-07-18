import { col, fn, literal, Op } from "sequelize";
import VendorOrder from "../models/VendorOrder";
import Product from "../models/ProductModel";
import Payment from "../models/PaymentModel";
import OrderItem from "../models/OrderItemModel";
import Category from "../models/CategoryModel";

class DashboardService {

    // static async getDashboardStats(farmId: number) {
    //     const sevenDaysAgo = new Date();
    //     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    //     const [totalOrders, totalAmount, totalProducts, totalPayment, topSellingProducts, dailySalesData, categorySales, monthlySalesData
    //     ] = await Promise.all([
    //         VendorOrder.count({
    //             where: { farmId: farmId }
    //         }),
    //         VendorOrder.findOne({
    //             where: { farmId: farmId },
    //             attributes: [
    //                 [fn("SUM", col("totalAmount")), "totalAmount"]
    //             ],
    //             raw: true,
    //         }),
    //         Product.count(
    //             {
    //                 where: { farmerId: farmId }
    //             }
    //         ),
    //         Payment.findOne({
    //             attributes: [
    //                 [fn("SUM", col("amount")), "totalAmount"]
    //             ],
    //             raw: true
    //         }),
    //         OrderItem.findAll({
    //             attributes: [
    //                 "productId",
    //                 [col("product.name"), "productName"],
    //                 [fn("SUM", col("OrderItem.quantity")), "totalSold"],
    //                 [fn("SUM", col("OrderItem.subtotal")), "totalRevenue"],
    //             ],
    //             include: [
    //                 {
    //                     model: Product,
    //                     attributes: [],
    //                 },
    //             ],
    //             group: [
    //                 "productId",
    //                 "product.id",
    //             ],
    //             order: [[literal("totalSold"), "DESC"]],
    //             limit: 5,
    //         }),
    //         VendorOrder.findAll({
    //             attributes: [
    //                 [fn("DATE", col("createdAt")), "date"],
    //                 [fn("SUM", col("totalAmount")), "sales"],
    //             ],
    //             where: {
    //                 createdAt: {
    //                     [Op.gte]: sevenDaysAgo,
    //                 },
    //             },
    //             group: [fn("DATE", col("createdAt"))],
    //             order: [[fn("DATE", col("createdAt")), "ASC"]],
    //             raw: true,
    //         }),
    //         OrderItem.findAll({
    //             attributes: [
    //                 [col("product.category.id"), "categoryId"],
    //                 [col("product.category.name"), "categoryName"],
    //                 [fn("SUM", col("OrderItem.quantity")), "totalSold"],
    //             ],
    //             include: [
    //                 {
    //                     model: Product,
    //                     attributes: [],
    //                     include: [
    //                         {
    //                             model: Category,
    //                             attributes: [],
    //                         },
    //                     ],
    //                 },
    //             ],
    //             group: [
    //                 "product.category.id",
    //                 "product.category.name",
    //             ],
    //             order: [[fn("SUM", col("quantity")), "DESC"]],
    //             limit: 5,
    //             raw: true,
    //         }),
    //         VendorOrder.findAll({
    //             attributes: [
    //                 [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
    //                 [fn("SUM", col("totalAmount")), "sales"],
    //             ],
    //             where: {
    //                 createdAt: {
    //                     [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 11)),
    //                 },
    //             },
    //             group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
    //             order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
    //             raw: true,
    //         })
    //     ]);

    //     // Process daily sales data for all days of the week (Sunday to Saturday)
    //     const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    //     const dailySalesMap = new Map();

    //     dailySalesData.forEach(item => {
    //         const date = new Date(item.date);
    //         const dayName = weekDays[date.getDay()];
    //         dailySalesMap.set(dayName, parseFloat(item.sales) || 0);
    //     });

    //     const dailySales = weekDays.map(day => ({
    //         day: day,
    //         sales: dailySalesMap.get(day) || 0
    //     }));

    //     const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    //     const monthlySalesMap = new Map();

    //     monthlySalesData.forEach(item => {
    //         const [year, month] = item.month.split('-');
    //         const monthIndex = parseInt(month, 10);
    //         const monthName = months[monthIndex - 1]; // January is index 0
    //         if (monthName) {
    //             monthlySalesMap.set(monthName, parseFloat(item.sales) || 0);
    //         }
    //     });

    //     const monthlySales = months.map(month => ({
    //         month: month,
    //         sales: monthlySalesMap.get(month) || 0
    //     }));

    //     return {
    //         totalOrders,
    //         totalAmount: totalAmount.totalAmount,
    //         totalProducts,
    //         totalPayment: totalPayment.totalAmount,
    //         topSellingProducts,
    //         dailySales,
    //         categorySales,
    //         monthlySales
    //     }
    // }

    static async getDashboardStats(farmId?: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const vendorOrderWhere = farmId && farmId > 0 ? { farmId } : {};
    const productWhere = farmId && farmId > 0 ? { farmId: farmId } : {};

    const [
        totalOrders,
        totalAmount,
        totalProducts,
        totalPayment,
        topSellingProducts,
        dailySalesData,
        categorySales,
        monthlySalesData,
    ] = await Promise.all([
        // Total Orders
        VendorOrder.count({
            where: vendorOrderWhere,
        }),

        // Total Sales Amount
        VendorOrder.findOne({
            where: vendorOrderWhere,
            attributes: [
                [fn("SUM", col("totalAmount")), "totalAmount"],
            ],
            raw: true,
        }),

        // Total Products
        Product.count({
            where: productWhere,
        }),

        // Total Payment
        Payment.findOne({
            attributes: [
                [fn("SUM", col("amount")), "totalAmount"],
            ],
            raw: true,
        }),

        // Top Selling Products
        OrderItem.findAll({
            attributes: [
                "productId",
                [col("product.name"), "productName"],
                [fn("SUM", col("OrderItem.quantity")), "totalSold"],
                [fn("SUM", col("OrderItem.subtotal")), "totalRevenue"],
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                    ...(farmId && farmId > 0
                        ? {
                              where: {
                                  farmId: farmId,
                              },
                          }
                        : {}),
                },
            ],
            group: [
                "productId",
                "product.id",
            ],
            order: [[literal("totalSold"), "DESC"]],
            limit: 5,
        }),

        // Daily Sales (Last 7 Days)
        VendorOrder.findAll({
            attributes: [
                [fn("DATE", col("createdAt")), "date"],
                [fn("SUM", col("totalAmount")), "sales"],
            ],
            where: {
                ...vendorOrderWhere,
                createdAt: {
                    [Op.gte]: sevenDaysAgo,
                },
            },
            group: [fn("DATE", col("createdAt"))],
            order: [[fn("DATE", col("createdAt")), "ASC"]],
            raw: true,
        }),

        // Category Sales
        OrderItem.findAll({
            attributes: [
                [col("product.category.id"), "categoryId"],
                [col("product.category.name"), "categoryName"],
                [fn("SUM", col("OrderItem.quantity")), "totalSold"],
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                    ...(farmId && farmId > 0
                        ? {
                              where: {
                                  farmId: farmId,
                              },
                          }
                        : {}),
                    include: [
                        {
                            model: Category,
                            attributes: [],
                        },
                    ],
                },
            ],
            group: [
                "product.category.id",
                "product.category.name",
            ],
            order: [[fn("SUM", col("OrderItem.quantity")), "DESC"]],
            limit: 5,
            raw: true,
        }),

        // Monthly Sales (Last 12 Months)
        VendorOrder.findAll({
            attributes: [
                [fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "month"],
                [fn("SUM", col("totalAmount")), "sales"],
            ],
            where: {
                ...vendorOrderWhere,
                createdAt: {
                    [Op.gte]: new Date(
                        new Date().setMonth(new Date().getMonth() - 11)
                    ),
                },
            },
            group: [fn("DATE_FORMAT", col("createdAt"), "%Y-%m")],
            order: [[fn("DATE_FORMAT", col("createdAt"), "%Y-%m"), "ASC"]],
            raw: true,
        }),
    ]);

    // Process daily sales
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailySalesMap = new Map<string, number>();

    dailySalesData.forEach((item: any) => {
        const date = new Date(item.date);
        const dayName = weekDays[date.getDay()];
        dailySalesMap.set(dayName, Number(item.sales) || 0);
    });

    const dailySales = weekDays.map((day) => ({
        day,
        sales: dailySalesMap.get(day) || 0,
    }));

    // Process monthly sales
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
    ];

    const monthlySalesMap = new Map<string, number>();

    monthlySalesData.forEach((item: any) => {
        const [, month] = item.month.split("-");
        const monthName = months[parseInt(month, 10) - 1];

        if (monthName) {
            monthlySalesMap.set(monthName, Number(item.sales) || 0);
        }
    });

    const monthlySales = months.map((month) => ({
        month,
        sales: monthlySalesMap.get(month) || 0,
    }));

    return {
        totalOrders,
        totalAmount: Number((totalAmount as any)?.totalAmount) || 0,
        totalProducts,
        totalPayment: Number((totalPayment as any)?.totalAmount) || 0,
        topSellingProducts,
        dailySales,
        categorySales,
        monthlySales,
    };
}

}

export default DashboardService;