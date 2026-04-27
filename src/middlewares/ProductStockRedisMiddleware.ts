import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import redisClient from "../redis/redis";


class ProductStockRedisMiddleware {
    getCachedProductStock() {
        return asyncHandler(
            async (_req: Request, res: Response, next: NextFunction) => {
                const key = `products:stock:all`;
                const cachedData = await redisClient.get(key);

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Product stock fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    clearProductStockCache() {
        return asyncHandler(
            async (_req: Request, _res: Response, next: NextFunction) => {
                const key = `products:stock:all`;
                await redisClient.del(key);
                return next();
            }
        );
    }

    getCachedProductStockById() {
        return asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const key = `product:stock`;
                const id = req.params?.id
                const cachedData = await redisClient.hget(key, id.toString());

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Product stock fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    clearProductStockCacheById() {
        return asyncHandler(
            async (req: Request, _res: Response, next: NextFunction) => {
                const key = `products:stock`;
                const id = req.params?.id
                await redisClient.hdel(key, id.toString());
                return next();
            }
        );
    }

    // getProductIdAndClearCacheById() {
    //     return asyncHandler(
    //         async (req: Request, res: Response, next: NextFunction) => {
    //             const key = `products:stock`;
    //             const id = req.params?.id
    //             await redisClient.hdel(key, id.toString());
    //             res.locals.productId = id;
    //             return next();
    //         }
    //     );
    // }
}


export default ProductStockRedisMiddleware;