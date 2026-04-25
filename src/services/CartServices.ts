import { Sequelize } from "sequelize-typescript";
import Cart from "../models/CartModel";
import Product from "../models/ProductModel";
import { NotFoundError } from "../utils/errors";
import redisClient from "../redis/redis";

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

        const existing = await Cart.findOne({
            where: {
                userId: data.userId,
                productId: data.productId,
                isActive: true,
            },
        });

        let newQty: number;
        let cartId: number;

        if (existing) {
            newQty = Number(existing.quantity) + data.quantity;
            cartId = existing.id;
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

            cartId = cart.id;
        }

        await redisClient.hset(key, data.productId, JSON.stringify({ id: cartId, qty: newQty }));
        await redisClient.expire(key, 7 * 24 * 60 * 60);
        return true;
    }

    static async getMyCart(userId: number) {

        const key = `cart:user:${userId}`;

        const cart = await redisClient.hgetall(key);
        const productIds = Object.keys(cart).map(Number);

        if (productIds.length > 0) {
            const products = await Product.findAll({
                where: { id: productIds },
                attributes: ["id", "name", "rate", "farmId"]
            });

            return products.map((product: any) => {
                const { id, name, rate, farmId } = product;

                const raw = cart[id];

                const parsed = JSON.parse(raw);

                return {
                    cartId: parsed.id,
                    productId: id,
                    productName: name,
                    quantity: parsed.qty,
                    price:rate,
                    total: parsed.qty * rate,
                    farmId,
                    userId
                };
            });
        }

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
                "userId"
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