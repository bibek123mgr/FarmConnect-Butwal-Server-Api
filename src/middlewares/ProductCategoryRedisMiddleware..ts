import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import redisClient from "../redis/redis";


class ProductCategoryRedisMiddleware {
    getCachedProductCategory() {
        return asyncHandler(
            async (_req: Request, res: Response, next: NextFunction) => {
                const key = `categories:all`;
                const cachedData = await redisClient.get(key);

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Product Category fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    clearProductCategoryCache() {
        return asyncHandler(
            async (_req: Request, _res: Response, next: NextFunction) => {
                const key = `categories:all`;
                await redisClient.del(key);
                return next();
            }
        );
    }

  
}


export default ProductCategoryRedisMiddleware;