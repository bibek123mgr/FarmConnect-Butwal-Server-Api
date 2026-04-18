
import { Op, Sequelize } from "sequelize";
import sequelize from "../../config/database";
import ProductPrice from "../../models/ProductPriceModel";
import ProductPriceHistory from "../../models/ProductPriceHistory";
import { NothingChangedError } from "../../utils/errors";
import Product from "../../models/ProductModel";
import Farm from "../../models/FarmModel";

interface CreateOrUpdatePriceDTO {
    productId: number;
    farmId: number;
    type: "FIXED" | "DISCOUNT";
    price: number;
    title?: string;
    effectiveFrom: Date;
    effectiveTo?: Date;
    userId: number;
}

class ProductPriceService {

    static async createOrUpdatePrice(data: CreateOrUpdatePriceDTO) {
        const t = await sequelize.transaction();

        try {
            if (data.type === "DISCOUNT" && !data.effectiveTo) {
                throw new Error("effectiveTo is required for DISCOUNT");
            }

            const existing = await ProductPrice.findOne({
                where: {
                    productId: data.productId,
                    farmId: data.farmId,
                    type: data.type
                },
                transaction: t
            });

            if (existing) {
                const isSame =
                    new Date(data.effectiveFrom).getTime() === new Date(existing.effectiveFrom).getTime() &&
                    new Date(data.effectiveTo || 0).getTime() === new Date(existing.effectiveTo || 0).getTime() &&
                    Number(data.price) === Number(existing.price) &&
                    (data.title || "") === (existing.title || "") &&
                    data.type === existing.type;

                if (isSame) {
                    throw new NothingChangedError("Nothing to update");
                }
                await existing.update({
                    title: data.title,
                    price: data.price,
                    effectiveFrom: data.effectiveFrom,
                    effectiveTo: data.type === "DISCOUNT" ? data.effectiveTo : null,
                    updatedBy: data.userId
                }, { transaction: t });
            } else {
                await ProductPrice.create({
                    productId: data.productId,
                    farmId: data.farmId,
                    title: data.title,
                    price: data.price,
                    type: data.type,
                    effectiveFrom: data.effectiveFrom,
                    effectiveTo: data.type === "DISCOUNT" ? data.effectiveTo : null,
                    updatedBy: data.userId
                }, { transaction: t });
            }
            await ProductPriceHistory.create({
                productId: data.productId,
                farmId: data.farmId,
                title: data.title,
                price: data.price,
                type: data.type,
                changedAt: new Date(),
                changedBy: data.userId
            } as any, { transaction: t });

            await t.commit();
            return true;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getPrice(productId: number, farmId: number) {
        const now = new Date();

        const price = await ProductPrice.findOne({
            where: {
                productId,
                farmId,
                isActive: true,
                effectiveFrom: { [Op.lte]: now },
                [Op.or]: [
                    { effectiveTo: null },
                    { effectiveTo: { [Op.gte]: now } }
                ]
            },
            order: [["type", "DESC"]]
        });

        return price;
    }

    static async getProductPrices(farmId: number) {
        return await ProductPrice.findAll({
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "farmId",
                [Sequelize.col("farm.farmName"), "farmName"],
                "title",
                "price",
                "type",
                "updatedAt",
                "updatedBy"
            ],
            where: { farmId },
            include: [
                { model: Product, attributes: [] },
                { model: Farm, attributes: [] }
            ],
            order: [["updatedAt", "DESC"]],
            raw: true
        });
    }
}

export default ProductPriceService;