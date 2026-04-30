import { Sequelize } from "sequelize-typescript";
import Cart from "../models/CartModel";
import Product from "../models/ProductModel";
import { NotFoundError } from "../utils/errors";
import redisClient from "../redis/redis";
import { hash } from "node:crypto";

export interface IAddToCart {
    userId: number;
    productId: number;
    farmId: number;
    quantity: number;
    price: number;
}

class CartService {
    static async addToCart(data: IAddToCart) {
        const key = `cart:user:${data.userId}`;
        await redisClient.del(key);

        const existing = await Cart.findOne({
            where: {
                userId: data.userId,
                productId: data.productId,
                isActive: true,
            },
        });

        let newQty: number;

        if (existing) {
            newQty = Number(existing.quantity) + data.quantity;
            const newTotal = newQty * data.price;

            await existing.update({
                quantity: newQty,
                price: data.price,
                total: newTotal,
            });
        } else {
            newQty = data.quantity;

            const cart = await Cart.create({
                ...data,
                total: data.quantity * data.price,
                isActive: true,
            });

        }
        return true;
    }

    static async getMyCart(userId: number) {

        const key = `cart:user:${userId}`;
        console.log("key", key);
        const cart = await Cart.findAll({
            where: { userId, isActive: true },
            attributes: [
                "id",
                "productId",
                [Sequelize.col("product.name"), "productName"],
                "quantity",
                "price",
                "total",
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
        if (cart.length > 0) {
            const hashData: Record<string, string> = {};
            cart.forEach((item) => {
                hashData[item.id] = JSON.stringify(item);
            });
            await redisClient.hmset(key, hashData);
            await redisClient.hset(key, hashData);
            await redisClient.expire(key, 600);
        }
        return cart;
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

    static async increaseQuantity(id: number) {
        const cart = await Cart.findByPk(id);
        if (!cart) throw new NotFoundError("Cart not found");
        cart.quantity += 1;
        cart.total = cart.quantity * cart.price;
        await cart.save();

    }

    static async decreaseQuantity(id: number) {
        const cart = await Cart.findByPk(id);
        if (!cart) throw new NotFoundError("Cart not found");
        cart.quantity -= 1;
        cart.total = cart.quantity * cart.price;
        await cart.save();
    }
}

export default CartService;