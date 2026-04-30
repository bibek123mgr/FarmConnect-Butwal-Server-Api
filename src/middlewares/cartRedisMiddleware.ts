import { NextFunction, Response } from "express";
import redisClient from "../redis/redis";
import { AuthRequest } from "./Auth";
import { asyncHandler } from "../utils/asyncHandler";
import { it } from "node:test";
import { parse } from "node:path";

class CartRedisMiddleware {
    static removeCartCache() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `cart:user:${req.user?.id}`;
            await redisClient.del(key);
            next();
        });
    }
    static getCartFromCache() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `cart:user:${req.user?.id}`;
            const cachedItems = await redisClient.hvals(key);
            if (!cachedItems || cachedItems.length === 0) {
                return next();
            }
            const parsedCart = cachedItems.map((item) => JSON.parse(item));
            return res.status(200).json({
                success: true,
                message: "Cart fetched successfully",
                data: parsedCart,
            });
        });
    }

    static IncrenmentCart() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `cart:user:${req.user?.id}`;
            const productId = req.params.id;
            const cachedItems = await redisClient.hget(key, productId.toString());

            if (!cachedItems) return next();

            const parsedCart = JSON.parse(cachedItems);
            parsedCart.quantity = Number(parsedCart.quantity) + 1;
            parsedCart.total = (parsedCart.quantity * Number(parsedCart.price)).toFixed(2);

            await redisClient.hset(key, productId.toString(), JSON.stringify(parsedCart));
            next();
        });
    }

    static DecrementCart() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `cart:user:${req.user?.id}`;
            const productId = req.params.id;
            const cachedItems = await redisClient.hget(key, productId.toString());

            if (!cachedItems) return next();

            const parsedCart = JSON.parse(cachedItems);
            if (parsedCart.quantity > 1) {
                parsedCart.quantity = Number(parsedCart.quantity) - 1;
                parsedCart.total = (parsedCart.quantity * Number(parsedCart.price)).toFixed(2);
                await redisClient.hset(key, productId.toString(), JSON.stringify(parsedCart));
            }

            next();
        });
    }


    static clearOneCartItem() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `cart:user:${req.user?.id}`;
            const productId = req.params.id;
            await redisClient.hdel(key, productId.toString());
            next();
        });
    }
}

export default CartRedisMiddleware;