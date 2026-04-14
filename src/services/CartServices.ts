import { Sequelize } from "sequelize-typescript";
import Cart from "../models/CartModel";
import Product from "../models/ProductModel";
import { NotFoundError } from "../utils/errors";

export interface IAddToCart {
    userId: number;
    productId: number;
    farmId: number;
    quantity: number;
    price: number;
}

class CartService {
    static async addToCart(data: IAddToCart) {
        const total = data.quantity * data.price;

        const existing = await Cart.findOne({
            where: {
                userId: data.userId,
                productId: data.productId,
                isActive: true,
            },
        });

        if (existing) {
            const newQty = Number(existing.quantity) + data.quantity;
            const newTotal = newQty * data.price;

            await existing.update({
                quantity: newQty,
                price: data.price,
                total: newTotal,
            });

            return existing;
        }

        return await Cart.create({
            ...data,
            total,
            isActive: true,
        });
    }

    static async getMyCart(userId: number) {
        return await Cart.findAll({
            where: { userId, isActive: true },
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "quantity",
                "price",
                "total",
                "farmId",
                "userId",
                "createdAt"
            ],
            include: [
                {
                    model: Product,
                    attributes: [],
                },
            ],
            order: [["createdAt", "DESC"]],
            raw: true
        });
    }

    static async updateCart(id: number, data: any) {
        const cart = await Cart.findByPk(id);

        if (!cart) throw new NotFoundError("Cart not found");

        const quantity = data.quantity ?? cart.quantity;
        const price = data.price ?? cart.price;

        await cart.update({
            ...data,
            total: quantity * price,
        });

        return cart;
    }

    static async removeCart(id: number) {
        const cart = await Cart.findByPk(id);

        if (!cart) throw new NotFoundError("Cart not found");

        await cart.update({ isActive: false });

        return true;
    }

    static async clearCart(userId: number) {

        await Cart.update(
            { isActive: false },
            { where: { userId: userId } }
        );

        return true;
    }
}

export default CartService;