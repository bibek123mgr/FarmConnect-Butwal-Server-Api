import { NextFunction, Response } from "express";
import redisClient from "../redis/redis";
import { AuthRequest } from "./Auth";
import { asyncHandler } from "../utils/asyncHandler";

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
            const cart = await redisClient.get(key);
            if (!cart) {
                return next();
            }
            const parsedCart = JSON.parse(cart);
            return res.status(200).json({
                success: true,
                message: "Cart fetched successfully",
                data: parsedCart,
            });
        });
    }
}

export default CartRedisMiddleware;