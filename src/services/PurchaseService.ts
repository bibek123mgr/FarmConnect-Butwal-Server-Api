import sequelize from "../config/database";
import ActualStock from "../models/ActualStockMode";
import Product from "../models/ProductModel";
import Purchase from "../models/PurchaseModel";
import Stock, { comesFrom } from "../models/StockModel";
import { NotFoundError } from "../utils/errors";

export interface CreatePurchaseDTO {
    id?: number;
    productId: number;
    quantity: number;
    costPerUnit: number;
    farmId: number;
    userId: number;
}

class PurchaseService {

    static async createPurchase(purchaseData: CreatePurchaseDTO) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findByPk(purchaseData.productId, { transaction: t });
            if (!product) throw new NotFoundError("Product not found");
            const { productId, quantity, costPerUnit, userId } = purchaseData;

            const totalCost = quantity * costPerUnit;

            const purchase = await Purchase.create({
                productId,
                quantity,
                costPerUnit,
                totalCost,
                userId,
            }, { transaction: t });

            await ActualStock.increment(
                {
                    purchase: purchaseData.quantity
                },
                {
                    where: {
                        productId: purchaseData.productId
                    },
                    transaction: t
                }
            );

            await Stock.create({
                productId: purchaseData.productId,
                production: purchaseData.quantity,
                sales: 0,
                salesReturn: 0,
                damage: 0,
                chalan: 0,
                chalanReturn: 0,
                rate: purchaseData.costPerUnit || 0,
                amount: (purchaseData.costPerUnit || 0) * purchaseData.quantity,
                farmId: purchaseData.farmId,
                createdBy: purchaseData.userId,
                tableId: purchase.id,
                comesFrom: comesFrom.PURCHASE
            }, { transaction: t });

            await t.commit();

            return purchase;
        } catch (error) {
            throw error;
        }
    }

}

export default PurchaseService