import { Sequelize } from "sequelize-typescript";
import { sequelize } from "../../config/database";
import Farm from "../../models/FarmModel";
import Product from "../../models/ProductModel";
import { comesFrom, Stock } from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";
import Category from "../../models/CategoryModel";
import redisClient from "../../redis/redis";
import { QueryTypes } from "sequelize";
import ProductPrice from "../../models/ProductPriceModel";

interface CreateProductDTO {
    userId: number;
    farmId?: number;
    name: string;
    description?: string;
    unit: string;
    quantity?: number;
    rate?: number;
    categoryId?: number
}

class ProductService {
    static async createProduct(data: CreateProductDTO) {
        const t = await sequelize.transaction();
        try {
            const product = await Product.create(
                {
                    farmerId: data.userId,
                    name: data.name,
                    description: data.description,
                    unit: data.unit,
                    quantity: data.quantity || 0,
                    rate: data.rate || 0,
                    isActive: true,
                    categoryId: data.categoryId,
                    farmId: data.farmId
                },
                { transaction: t }
            );

            await Stock.create(
                {
                    productId: product.id,
                    openingStock: data.quantity || 0,
                    sales: 0,
                    salesReturn: 0,
                    damage: 0,
                    chalan: 0,
                    chalanReturn: 0,
                    rate: data.rate || 0,
                    amount: (data.quantity || 0) * (data.rate || 0),
                    createdBy: data.userId,
                    farmId: data.farmId,
                    isActive: true,
                    comesFrom: comesFrom.OPENING_STOCK,
                    tableId: product.id
                },
                { transaction: t }
            );

            await t.commit();
            return product;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
    static async getAllProducts() {
        const products = await Product.findAll({
            where: { isActive: true },
            attributes: [
                "id",
                "name",
                "description",
                "farmId",
                "categoryId",
                [Sequelize.col("farm.farmName"), "farmName"],
                [Sequelize.col("category.name"), "categoryName"]
            ],
            include: [
                {
                    model: Farm,
                    attributes: []
                },
                {
                    model: Category,
                    attributes: []
                }
            ],
            order: [["createdAt", "DESC"]],
            raw: true
        });

        const finalProducts = await Promise.all(
            products.map(async (product: any) => {
                const [availableStockResult, prices] = await Promise.all([
                    sequelize.query(
                        `
                SELECT COALESCE(
                    SUM(
                        openingStock 
                        + production
                        - sales 
                        + salesReturn 
                        - damage 
                        - chalan 
                        + chalanReturn
                    ), 0
                ) as availableStock
                FROM stock
                WHERE productId = ?
                AND isActive = 1
                `,
                        {
                            replacements: [product.id],
                            type: QueryTypes.SELECT
                        }
                    ),

                    ProductPrice.findAll({
                        where: {
                            productId: product.id,
                            isActive: true
                        },
                        attributes: ["price", "type"],
                        raw: true
                    })
                ]);

                const originalPrice = prices.find(
                    (price: any) => price.type === "FIXED"
                )?.price || 0;

                const discountPrice = prices.find(
                    (price: any) => price.type === "DISCOUNT"
                )?.price || 0;

                return {
                    ...product,
                    availableStock: (availableStockResult[0] as { availableStock: number })?.availableStock || 0,
                    originalPrice,
                    discountPrice
                };
            })
        );


        await redisClient.set(
            "products:stock:all",
            JSON.stringify(finalProducts),
            "EX",
            600
        );
        return finalProducts;

    }

    static async getAllMyProducts(userId: number) {
        const products = await Product.findAll({
            where: {
                isActive: true,
                farmerId: userId
            },
            attributes: [
                "id",
                "name",
                "description",
                "unit",
                "rate",
                "farmId",
                "categoryId",
                [Sequelize.col("farm.farmName"), "farmName"],
                [Sequelize.col("category.name"), "categoryName"]
            ],
            include: [
                {
                    model: Farm,
                    attributes: []
                },
                {
                    model: Category,
                    attributes: []
                }
            ],
            order: [["createdAt", "DESC"]],
            raw: true
        });
        return products;

    }

    static async getProductById(id: number) {
        const product = await Product.findOne({
            where: { id: id },
            attributes: [
                "id",
                "name",
                "description",
                "unit",
                "rate",
                "farmId",
                "categoryId",
                [Sequelize.col("farm.farmName"), "farmName"],
                [Sequelize.col("category.name"), "categoryName"]
            ],
            include: [
                {
                    model: Farm,
                    attributes: []
                },
                {
                    model: Category,
                    attributes: []
                }
            ],
            order: [["createdAt", "DESC"]],
            raw: true
        });

        if (!product) {
            throw new NotFoundError("Product not found");
        }
        return product;
    }

    static async updateProduct(id: number, data: Partial<CreateProductDTO>) {
        const product = await Product.findByPk(id);

        if (!product) {
            throw new NotFoundError("Product not found");
        }

        await product.update({
            name: data.name ?? product.name,
            description: data.description ?? product.description,
            unit: data.unit ?? product.unit,
            quantity: data.quantity ?? product.quantity,
            rate: data.rate ?? product.rate,
            categoryId: data.categoryId ?? product.categoryId
        });

        return product;
    }

    static async deleteProduct(id: number) {
        const t = await sequelize.transaction();

        try {
            const product = await Product.findByPk(id, { transaction: t });

            if (!product) {
                throw new NotFoundError("Product not found");
            }

            await product.update(
                { isActive: false },
                { transaction: t }
            );

            await Stock.update(
                { isActive: false },
                {
                    where: { productId: id },
                    transaction: t,
                }
            );

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

export default ProductService;