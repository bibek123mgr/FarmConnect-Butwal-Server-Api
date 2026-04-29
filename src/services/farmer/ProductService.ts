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
import ActualStock from "../../models/ActualStockMode";

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

            await ActualStock.create(
                {
                    productId: product.id,
                    openingStock: data.quantity || 0,
                    sales: 0,
                    salesReturn: 0,
                    damage: 0,
                    chalan: 0,
                    chalanReturn: 0,
                    reserveQuantity: 0,
                    createdBy: data.userId,
                    isActive: true
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
       
        const products = await sequelize.query(`
        SELECT 
            p.id, 
            p.name, 
            p.description, 
            p.unit, 
            COALESCE(pp.price,0) as rate, 
            p.farmId, 
            p.categoryId, 
            f.farmName, 
            c.name as categoryName,
        COALESCE(SUM(a.openingStock + a.production - a.sales + a.salesReturn - a.damage - a.chalan + a.chalanReturn - a.reserveQuantity), 0) AS quantity
        FROM products p 
        INNER JOIN actual_stock as a ON p.id = a.productId
        INNER JOIN farms f ON p.farmId = f.id
        INNER JOIN categories c ON p.categoryId = c.id
        LEFT JOIN product_prices pp ON p.id = pp.productId
        AND p.isActive = 1
        GROUP BY p.id;`,
            {
                type: QueryTypes.SELECT
        })

         await redisClient.set(
            "products:stock:all",
            JSON.stringify(products),
            "EX",
            600
        );

        return products

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
        const transcation = await sequelize.transaction();
        try {
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

            await ActualStock.update(
                {
                    openingStock: data.quantity ?? product.quantity
                },
                {
                    where: { productId: id },
                }
            );

            await Stock.update(
                {
                    rate: data.rate ?? product.rate,
                    amount: ((data.quantity ?? product.quantity) * (data.rate ?? product.rate)),
                    openingStock: data.quantity ?? product.quantity
                },
                {
                    where: { productId: id },
                }
            );

            await transcation.commit();
            return product;
        } catch (error) {
            await transcation.rollback();
            throw error;
        }
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

            await ActualStock.update(
                { isActive: false },
                {
                    where: { productId: id },
                    transaction: t,
                }
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