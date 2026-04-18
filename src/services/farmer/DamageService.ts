import { table } from "node:console";
import sequelize from "../../config/database";
import Damage from "../../models/DamageModel";
import Farm from "../../models/FarmModel";
import Product from "../../models/ProductModel";
import Stock, { comesFrom } from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";
import { Sequelize } from "sequelize";

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
                createdBy: data.userId,
                comesFrom: comesFrom.DAMAGE,
                tableId: damage.id
            }, { transaction: t });

            await t.commit();
            return damage;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async updateDamage(id: number, data: Partial<CreateDamageDTO>) {
        const t = await sequelize.transaction();

        try {
            const damage = await Damage.findByPk(id, { transaction: t });
            if (!damage) throw new NotFoundError("Damage not found");

            const newQuantity = data.quantity || 0;
            const lossAmount = data.lossAmount || 0;
            const newCost = lossAmount
                / newQuantity;

            await damage.update({
                productId: data.productId,
                farmId: data.farmId,
                quantity: data.quantity,
                reason: data.reason,
                lossAmount: data.lossAmount,
                remarks: data.remarks
            }, { transaction: t });

            const stock = await Stock.findOne({
                where: {
                    tableId: id,
                    comesFrom: comesFrom.DAMAGE
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!stock) throw new NotFoundError("Stock entry not found");
            await stock.update({
                damage: newQuantity,
                rate: newCost,
                amount: lossAmount
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
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "farmId",
                [Sequelize.col("farm.farmName"), "farmName"],
                "quantity",
                "lossAmount",
                "reason",
                "remarks",
                "createdAt"
            ],
            include: [
                { model: Product, attributes: [] },
                { model: Farm, attributes: [] }
            ],
            order: [["createdAt", "DESC"]],
            raw: true
        });
    }

    static async getDamageById(id: number) {
        const damage = await Damage.findByPk(id, {
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "farmId",
                [Sequelize.col("farm.farmName"), "farmName"],
                "quantity",
                "lossAmount",
                "reason",
                "remarks",
                "createdAt"
            ],
            include: [
                { model: Product, attributes: [] },
                { model: Farm, attributes: [] }
            ]
        });

        if (!damage) throw new NotFoundError("Damage record not found");
        return damage;
    }

    static async deleteDamage(id: number) {
        const damage = await Damage.findByPk(id);
        if (!damage) throw new NotFoundError("Damage record not found");

        await damage.update({ isActive: false });
        await Stock.update({ isActive: false }, { where: { tableId: id, comesFrom: comesFrom.DAMAGE } });
        return true;
    }
}

export default DamageService;