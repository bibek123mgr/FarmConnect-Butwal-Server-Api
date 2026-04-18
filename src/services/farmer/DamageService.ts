import sequelize from "../../config/database";
import Damage from "../../models/DamageModel";
import Farm from "../../models/FarmModel";
import Product from "../../models/ProductModel";
import Stock from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";

interface CreateDamageDTO {
    productId: number;
    farmId: number;
    userId: number;
    quantity: number;
    reason: string;
    lossAmount?: number;
    remarks?: string;
}

class DamageService {

    static async createDamage(data: CreateDamageDTO) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findByPk(data.productId, { transaction: t });
            if (!product) throw new NotFoundError("Product not found");

            const farm = await Farm.findByPk(data.farmId, { transaction: t });
            if (!farm) throw new NotFoundError("Farm not found");

            const damage = await Damage.create({
                productId: data.productId,
                farmId: data.farmId,
                userId: data.userId,
                quantity: data.quantity,
                reason: data.reason,
                lossAmount: data.lossAmount,
                remarks: data.remarks
            }, { transaction: t });

            // Stock reduction (damage means loss)
            await Stock.create({
                productId: data.productId,
                openingStock: 0,
                sales: 0,
                salesReturn: 0,
                damage: data.quantity,
                chalan: 0,
                chalanReturn: 0,
                rate: 0,
                amount: data.lossAmount || 0,
                farmId: data.farmId,
                createdBy: data.userId
            }, { transaction: t });

            await t.commit();
            return damage;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getAllDamages(userId: number) {
        return await Damage.findAll({
            where: { userId, isActive: true },
            include: [
                { model: Product, attributes: ["name"] },
                { model: Farm, attributes: ["farmName"] }
            ],
            order: [["createdAt", "DESC"]]
        });
    }

    static async getDamageById(id: number) {
        const damage = await Damage.findByPk(id, {
            include: [
                { model: Product, attributes: ["name"] },
                { model: Farm, attributes: ["farmName"] }
            ]
        });

        if (!damage) throw new NotFoundError("Damage record not found");
        return damage;
    }

    static async deleteDamage(id: number) {
        const damage = await Damage.findByPk(id);
        if (!damage) throw new NotFoundError("Damage record not found");

        await damage.update({ isActive: false });
        return true;
    }
}

export default DamageService;