import { Sequelize } from "sequelize-typescript";
import Category from "../../models/CategoryModel";
import Product from "../../models/ProductModel";
import redisClient from "../../redis/redis";
import { NotFoundError } from "../../utils/errors";
import OrderItem from "../../models/OrderItemModel";

export interface ICreateCategory {
    name: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    createdBy: number;
}

export interface IUpdateCategory {
    name?: string;
    description?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
}

class ProductCategoryService {
    static async createCategory(data: ICreateCategory) {
        const category = await Category.create({
            name: data.name,
            description: data.description,
            image: data.image,
            sortOrder: data.sortOrder || 0,
            createdBy: data.createdBy,
            isActive: true,
        });
        return category;

    }

    static async getAllCategories() {
        const categories = await Category.findAll({
            where: { isActive: true },
            attributes: ["id", "name", "description", "image"],
            order: [["sortOrder", "ASC"]],
        });
        await redisClient.set("categories:all", JSON.stringify(categories), "EX", 300);
        return categories;
    }

    static async getAllMyCategories() {
        const categories = await Category.findAll({
            where: { isActive: true },
            attributes: ["id", "name", "description", "image", "sortOrder"],
            order: [["sortOrder", "ASC"]],
        });

        return categories;
    }

    static async getCategoryById(id: number) {
        const category = await Category.findOne({
            where: { id, isActive: true },
            attributes: ["id", "name","description", "image", "sortOrder"],
        });
        if (!category) {
            throw new NotFoundError("Category not found");
        }

        return category;
    }

    static async updateCategory(id: number, data: IUpdateCategory) {
        const category = await Category.findByPk(id);

        if (!category) {
            throw new NotFoundError("Category not found");
        }

        await category.update(data);
        return category;
    }

    static async deleteCategory(id: number) {
        const category = await Category.findByPk(id);

        if (!category) {
            throw new NotFoundError("Category not found");
        }

        await category.update({ isActive: false });

        return true;
    }

    static async stats() {
        const [
            activeCategories,
            totalCategories,
            topProductCategory,
            topSellingCategory
        ] = await Promise.all([
            Category.count({ where: { isActive: true } }),
            Category.count(),
            Product.findAll({
                attributes: [
                    "categoryId",
                    [Sequelize.fn("COUNT", Sequelize.col("Product.id")), "productCount"],
                ],
                include: [
                    {
                        model: Category,
                        attributes: ["id", "name"],
                    },
                ],
                group: ["categoryId"],
                order: [[Sequelize.literal("productCount"), "DESC"]],
                limit: 1,
            }),
            await OrderItem.findAll({
                attributes: [
                    [Sequelize.col("product.categoryId"), "categoryId"],
                    [Sequelize.fn("SUM", Sequelize.col("OrderItem.quantity")), "totalSold"],
                ],
                include: [
                    {
                        model: Product,
                        attributes: ["categoryId"],
                        include: [
                            {
                                model: Category,
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
                group: ["product.categoryId", "product->category.id"],
                order: [[Sequelize.literal("totalSold"), "DESC"]],
                limit: 1,
            })
        ]);

        const topCategoryByProduct = topProductCategory[0];
        const topCategoryBySales = topSellingCategory[0];

        return {
            categories: {
                total: totalCategories,
                active: activeCategories,
            },

            topProductCategory: topCategoryByProduct
                ? {
                    categoryId: topCategoryByProduct.categoryId,
                    name: (topCategoryByProduct as any).category.name,
                    productCount: Number(
                        (topCategoryByProduct as any).get("productCount")
                    ),
                }
                : null,

            topSellingCategory: topCategoryBySales
                ? {
                    categoryId: topCategoryBySales.get("categoryId"),
                    name: (topCategoryBySales as any).product.category.name,
                    totalSold: Number(topCategoryBySales.get("totalSold")),
                }
                : null,
        };
    }
}

export default ProductCategoryService;