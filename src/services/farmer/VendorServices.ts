import { Op } from "sequelize";
import Farm from "../../models/FarmModel";
import User from "../../models/UserModel";
import { Sequelize } from "sequelize-typescript";

export interface IVendorPagination {
    page: number;
    limit: number;
    search?: string;
    status?: boolean;
}

class VendorServices {
    static async getAllVendors(data: IVendorPagination) {
        const { page, limit, search, status } = data;

        const offset = (page - 1) * limit;

        let whereConditions: any = {};

        if (search) {
            whereConditions.name = {
                [Op.like]: `%${search}%`,
            };
        }

        if (status !== undefined) {
            whereConditions.status = status;
        }

        const { rows, count } = await Farm.findAndCountAll({
            where: whereConditions,
            offset,
            limit,
            order: [["id", "DESC"]],
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM products
                            WHERE products.farmId = Farm.id
                        )`),
                        "totalProducts",
                    ],

                    [
                        Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM vendor_orders
                            WHERE vendor_orders.farmId = Farm.id
                        )`),
                        "totalOrders",
                    ],

                    [
                        Sequelize.literal(`(
                            SELECT COALESCE(SUM(vendor_orders.totalAmount), 0)
                            FROM vendor_orders
                            WHERE vendor_orders.farmId = Farm.id
                        )`),
                        "totalSalesRevenue",
                    ],
                ],
            },

            include: [
                {
                    model: User,
                    attributes: ["name", "email", "createdAt"],
                },
            ],
        });

        return {
            data: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        };
    }
}

export default VendorServices