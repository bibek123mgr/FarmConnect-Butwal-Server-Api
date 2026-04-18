import sequelize from "../../config/database";
import Farm from "../../models/FarmModel";
import Production from "../../models/ProductionModel";
import Product from "../../models/ProductModel";
import Stock from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";

interface CreateProductionDTO {
    productId: number;
    farmId: number;
    userId: number;
    quantity: number;
    costPerUnit?: number;
    remarks?: string;
}

class ProductionService {

    static async createProduction(data: CreateProductionDTO) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findByPk(data.productId, { transaction: t });
            if (!product) throw new NotFoundError("Product not found");

            const farm = await Farm.findByPk(data.farmId, { transaction: t });
            if (!farm) throw new NotFoundError("Farm not found");

            const production = await Production.create({
                productId: data.productId,
                farmId: data.farmId,
                userId: data.userId,
                quantity: data.quantity,
                costPerUnit: data.costPerUnit,
                remarks: data.remarks
            }, { transaction: t });

            // Stock increase (production means incoming stock)
            await Stock.create({
                productId: data.productId,
                openingStock: data.quantity,
                sales: 0,
                salesReturn: 0,
                damage: 0,
                chalan: 0,
                chalanReturn: 0,
                rate: data.costPerUnit || 0,
                amount: (data.costPerUnit || 0) * data.quantity,
                farmId: data.farmId,
                createdBy: data.userId
            }, { transaction: t });

            await t.commit();
            return production;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getAllProductions(userId: number) {
        return await Production.findAll({
            where: { userId, isActive: true },
            include: [
                { model: Product, attributes: ["name"] },
                { model: Farm, attributes: ["farmName"] }
            ],
            order: [["createdAt", "DESC"]]
        });
    }

    static async getProductionById(id: number) {
        const production = await Production.findByPk(id, {
            include: [
                { model: Product, attributes: ["name"] },
                { model: Farm, attributes: ["farmName"] }
            ]
        });

        if (!production) throw new NotFoundError("Production not found");
        return production;
    }

    static async deleteProduction(id: number) {
        const production = await Production.findByPk(id);
        if (!production) throw new NotFoundError("Production not found");

        await production.update({ isActive: false });
        return true;
    }
}

export default ProductionService;