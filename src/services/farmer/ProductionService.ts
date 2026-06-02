import { Sequelize } from "sequelize-typescript";
import sequelize from "../../config/database";
import Farm from "../../models/FarmModel";
import Production from "../../models/ProductionModel";
import Product from "../../models/ProductModel";
import Stock, { comesFrom } from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";
import ActualStock from "../../models/ActualStockMode";

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
        console.log(data);
        try {
            const product = await Product.findByPk(data.productId, { transaction: t });
            if (!product) throw new NotFoundError("Product not found");

            const production = await Production.create({
                productId: data.productId,
                farmId: data.farmId,
                userId: data.userId,
                quantity: data.quantity,
                costPerUnit: data.costPerUnit,
                remarks: data.remarks
            }, { transaction: t });

            await ActualStock.increment(
                {
                    production: data.quantity
                },
                {
                    where: {
                        productId: data.productId
                    },
                    transaction: t
                }
            );

            // Stock increase (production means incoming stock)
            await Stock.create({
                productId: data.productId,
                production: data.quantity,
                sales: 0,
                salesReturn: 0,
                damage: 0,
                chalan: 0,
                chalanReturn: 0,
                rate: data.costPerUnit || 0,
                amount: (data.costPerUnit || 0) * data.quantity,
                farmId: data.farmId,
                createdBy: data.userId,
                tableId: production.id,
                comesFrom: comesFrom.PRODUCTION
            }, { transaction: t });

            await t.commit();
            return production;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async updateProduction(id: number, data: Partial<CreateProductionDTO>) {
        const t = await sequelize.transaction();

        try {
            const production = await Production.findByPk(id, { transaction: t });
            if (!production) throw new NotFoundError("Production not found");

            const newQuantity = data.quantity || 0;
            const newCost = data.costPerUnit || 0;
            const amount = newCost * newQuantity;

            await production.update({
                productId: data.productId,
                quantity: newQuantity,
                costPerUnit: newCost,
                remarks: data.remarks
            }, { transaction: t });

            await ActualStock.increment(
                {
                    production: newQuantity - production.quantity
                },
                {
                    where: {
                        productId: data.productId
                    },
                    transaction: t
                }
            );

            const stock = await Stock.findOne({
                where: {
                    tableId: id,
                    comesFrom: comesFrom.PRODUCTION
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!stock) throw new NotFoundError("Stock entry not found");
            await stock.update({
                production: newQuantity,
                rate: newCost,
                amount: amount
            }, { transaction: t });

            await t.commit();
            return production;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getAllProductions(userId: number) {
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await Production.findAndCountAll({
            where: {
                userId,
                isActive: true
            },
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "farmId",
                [Sequelize.col("farm.farmName"), "farmName"],
                "quantity",
                "costPerUnit",
                "remarks",
                "createdAt"
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                    required: true
                },
                {
                    model: Farm,
                    attributes: [],
                    required: true
                }
            ],
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            raw: true
        });

        return {
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    static async getProductionById(id: number) {
        const production = await Production.findByPk(id, {
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "farmId",
                [Sequelize.col("farm.farmName"), "farmName"],
                "quantity",
                "costPerUnit",
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

        if (!production) throw new NotFoundError("Production not found");
        return production;
    }

    static async deleteProduction(id: number) {
        const production = await Production.findByPk(id);
        if (!production) throw new NotFoundError("Production not found");

        await production.update({ isActive: false });

        await ActualStock.increment(
            {
                production: 0 - production.quantity
            },
            {
                where: {
                    productId: production.productId
                }
            }
        );
        await Stock.update({ isActive: false }, { where: { tableId: id, comesFrom: comesFrom.PRODUCTION } });
    }

    static async stats(userId: number) {
        const [totalProductions, totalQuantity, costResult]: any = await Promise.all([
            Production.count({
                where: {
                    userId,
                    isActive: true,
                },
            }),

            Production.sum("quantity", {
                where: {
                    userId,
                    isActive: true,
                },
            }),

            Production.findOne({
                where: {
                    userId,
                    isActive: true,
                },
                attributes: [
                    [
                        Sequelize.fn(
                            "SUM",
                            Sequelize.literal("quantity * costPerUnit")
                        ),
                        "totalCost",
                    ],
                ],
                raw: true,
            }),
        ]);

        return {
            totalProductions,
            totalQuantity: Number(totalQuantity || 0),
            totalCost: Number(costResult?.totalCost || 0),
        };
    }
}

export default ProductionService;