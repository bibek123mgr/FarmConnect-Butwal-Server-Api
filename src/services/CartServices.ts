import { Sequelize } from "sequelize-typescript";
import Cart from "../models/CartModel";
import Product from "../models/ProductModel";
import { NotFoundError } from "../utils/errors";
import redisClient from "../redis/redis";
import sequelize from "../config/database";

export interface IAddToCart {
    userId: number;
    productId: number;
    quantity: number;
    price: number;
}

class CartService {

    static async addToCart(data: IAddToCart) {
        const key = `cart:user:${data.userId}`;
        const t = await sequelize.transaction();

        try {
            const product = await Product.findByPk(data.productId, { transaction: t });
            if (!product) throw new NotFoundError("Product not found");

            const price = Number(product.rate);

            const existing = await Cart.findOne({
                where: {
                    userId: data.userId,
                    productId: data.productId,
                    isActive: true,
                },
                transaction: t
            });

            let cartItem;

            if (existing) {
                const newQty = Number(existing.quantity) + data.quantity;

                if (newQty > Number(product.quantity)) {
                    throw new Error("Insufficient stock");
                }

                const newTotal = newQty * price;

                await existing.update({
                    quantity: newQty,
                    price,
                    total: newTotal,
                }, { transaction: t });

                // ✅ No extra DB query — build object directly
                cartItem = {
                    id: existing.id,
                    productId: existing.productId,
                    productName: product.name,
                    quantity: newQty,
                    price,
                    total: newTotal
                };

                // ✅ Redis sync
                await redisClient.hset(
                    key,
                    existing.id.toString(),
                    JSON.stringify(cartItem)
                );

            } else {
                const newQty = data.quantity;

                if (newQty > Number(product.quantity)) {
                    throw new Error("Insufficient stock");
                }

                const cart = await Cart.create({
                    ...data,
                    price,
                    farmId: product.farmId,
                    total: newQty * price,
                    isActive: true,
                }, { transaction: t });

                cartItem = {
                    id: cart.id,
                    productId: cart.productId,
                    productName: product.name,
                    quantity: newQty,
                    price,
                    total: newQty * price
                };

                await redisClient.hset(
                    key,
                    cart.id.toString(),
                    JSON.stringify(cartItem)
                );
            }

            await t.commit();

            return cartItem; 

        } catch (err) {
            await t.rollback();
            throw err;
        }
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