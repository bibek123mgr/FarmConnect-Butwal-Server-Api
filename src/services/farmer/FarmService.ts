import { QueryTypes, Sequelize } from "sequelize";
import sequelize from "../../config/database";
import Farm from "../../models/FarmModel";
import { NotFoundError } from "../../utils/errors";
import redisClient from "../../redis/redis";
import User from "../../models/UserModel";
import Product from "../../models/ProductModel";

export interface ICreateFarm {
    userId: number;
    farmName: string;
    description?: string;
    province?: string;
    district?: string;
    address?: string;
    image?: string;
    panNo?: string;
    vatNo?: string;
}

export interface IUpdateFarm {
    farmName?: string;
    description?: string;
    province?: string;
    district?: string;
    address?: string;
    logo?: string;
    panNo?: string;
    vatNo?: string;
    isActive?: boolean;
    isVerified?: boolean;
}

class FarmService {
    static async createFarm(data: ICreateFarm) {
        const transaction = await sequelize.transaction();
        await Farm.create({
            userId: data.userId,
            farmName: data.farmName,
            description: data.description,
            province: data.province,
            district: data.district,
            address: data.address,
            logo: data.image,
            panNo: data.panNo,
            vatNo: data.vatNo,
            isActive: true,
            isVerified: false,
        }
            , { transaction });

        await User.update(
            {
                role: "farmer"
            }
            , { where: { id: data.userId }, transaction }
        )
        await transaction.commit();
        return true;
    }

    static async getAllFarms() {
        const farms = await Farm.findAll({
            where: { isActive: true },
            attributes: [
                "id",
                "farmName",
                "logo",
                [
                    Sequelize.fn("COUNT", Sequelize.col("products.id")),
                    "productCount",
                ],
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                    where: {
                        isActive: true,
                    },
                    required: false,
                },
            ],
            group: ["Farm.id"],
            order: [["createdAt", "DESC"]],
        });

        await redisClient.set("farms:all", JSON.stringify(farms), "EX", 300);
        return farms;
    }

    static async getTopFarms() {
        const farms = await sequelize.query(`
            SELECT 
                id,
                a.farmName,
                a.image,
                a.description,
                a.address as address
                from(
                    SELECT 
                        a.id,
                        a.logo as image,
                        a.farmName,
                        a.description,
                        CONCAT(a.province, ' ',a.district, ' ',a.address) as address,
                        SUM(b.totalAmount) as totalAmount
                    from farms a
                    LEFT JOIN vendor_orders b ON a.id=b.farmId
                    WHERE a.isActive=1 AND b.isActive=1
                    group by a.id
                    order by totalAmount DESC
                    limit 6
                ) AS a`,
            {
                type: QueryTypes.SELECT,
            })

        await redisClient.set("farms:topfarms", JSON.stringify(farms), "EX", 300);
        return farms;
    }

    static async getFarmById(id: number) {
        const farm = await Farm.findByPk(id, {
            attributes: [
                "id",
                "userId",
                [Sequelize.col("user.email"), "email"],
                [Sequelize.col("user.phone"), "phone"],
                "farmName",
                "description",
                "province",
                "district",
                "address",
                "logo",
                "panNo",
                "vatNo",
            ],
            include: [
                {
                    model: User,
                    attributes: []
                }
            ],
            raw: true
        });

        if (!farm) {
            throw new NotFoundError("Farm not found");
        }

        return farm;
    }

    static async getFarmsByUser(userId: number) {
        return await Farm.findAll({
            where: { userId, isActive: true },
            order: [["createdAt", "DESC"]],
        });
    }

    static async updateFarm(id: number, data: IUpdateFarm) {
        const farm = await Farm.findByPk(id);
        if (!farm) {
            throw new NotFoundError("Farm not found");
        }
        await farm.update(data);
        return farm;
    }

    static async deleteFarm(id: number) {
        const farm = await Farm.findByPk(id);
        if (!farm) {
            throw new NotFoundError("Farm not found");
        }
        await farm.update({ isActive: false });
        return true;
    }
}

export default FarmService;