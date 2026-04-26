import { NextFunction, Response } from "express";
import redisClient from "../redis/redis";
import { AuthRequest } from "./Auth";
import { asyncHandler } from "../utils/asyncHandler";

class ProductRedisMiddleware {
    static removeProductCache() {
        return asyncHandler(async (_req: AuthRequest, _res: Response, next: NextFunction) => {
            const key = `products`;
            await redisClient.del(key);
            next();

        });
    }
    static removeOneProductCache() {
        return asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
            const key = `products:${req.params.id}`;
            await redisClient.del(key);
            next();

        });
    }
    static getProductFromCache() {
        return asyncHandler(async (_req: AuthRequest, res: Response, next: NextFunction) => {

            const key = `products`;
            const products = await redisClient.get(key);
            if (!products) {
                return next();
            }
            const parsedProduct = JSON.parse(products);
            return res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: parsedProduct,
            });

        });
    }

     static getOneProductFromCache() {
        return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
            const id = req.params.id;

            const key = `products:${id}`;
            const products = await redisClient.get(key);
            if (!products) {
                return next();
            }
            const parsedProduct = JSON.parse(products);
            return res.status(200).json({
                success: true,
                message: "Product fetched successfully",
                data: parsedProduct,
            });

        });
    }
}

export default ProductRedisMiddleware;