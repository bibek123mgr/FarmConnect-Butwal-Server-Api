import { sequelize } from "../../config/database";
import Product from "../../models/ProductModel";
import { Stock } from "../../models/StockModel";
import { NotFoundError } from "../../utils/errors";

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
                    categoryId: data.categoryId
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
                    farmId: data.farmId || null,
                    isActive: true,
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
        return await Product.findAll({
            where: { isActive: true },
            order: [["createdAt", "DESC"]]
        });
    }

    static async getProductById(id: number) {
        const product = await Product.findByPk(id);

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