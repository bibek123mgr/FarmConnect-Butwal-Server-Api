import Category from "../../models/CategoryModel";
import redisClient from "../../redis/redis";
import { NotFoundError } from "../../utils/errors";

export interface ICreateCategory {
    name: string;
    slug: string;
    image?: string;
    sortOrder?: number;
    createdBy: number;
}

export interface IUpdateCategory {
    name?: string;
    slug?: string;
    image?: string;
    sortOrder?: number;
    isActive?: boolean;
}

class ProductCategoryService {
    static async createCategory(data: ICreateCategory) {
        return await Category.create({
            name: data.name,
            slug: data.slug,
            image: data.image,
            sortOrder: data.sortOrder || 0,
            createdBy: data.createdBy,
            isActive: true,
        });
    }

    static async getAllCategories() {
        return await Category.findAll({
            where: { isActive: true },
            attributes: ["id", "name","image"],
            order: [["sortOrder", "ASC"]],
        });
    }

      static async getAllMyCategories() {
        const categories = await Category.findAll({
            where: { isActive: true },
            attributes: ["id", "name", "slug", "image", "sortOrder"],
            order: [["sortOrder", "ASC"]],
        });
        await redisClient.set("categories:all", JSON.stringify(categories));
        return categories;
    }

    static async getCategoryById(id: number) {
        const category = await Category.findOne({
            where: { id, isActive: true },
            attributes: ["id", "name", "slug", "image", "sortOrder"],
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
}

export default ProductCategoryService;