import { NextFunction, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "./Auth";
import redisClient from "../redis/redis";

class OrderRedisMiddleware {
    getAllCachedOrderData() {
        return asyncHandler(
            async (req: AuthRequest, res: Response, next: NextFunction) => {
                const key = `user:${req.user?.id}:orders`;

                const cachedData = await redisClient.get(key);

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Orders fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    getCachedOrderData() {
        return asyncHandler(
            async (req: AuthRequest, res: Response, next: NextFunction) => {
                const key = `orders`;
                const id = req.params?.id
                const cachedData = await redisClient.hget(key, id.toString());

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Order fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    getCachedOrderDataDetails() {
        return asyncHandler(
            async (req: AuthRequest, res: Response, next: NextFunction) => {
                const key = `order:details`;
                const id = req.params?.id

                const cachedData = await redisClient.hget(key, id.toString());

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Order details fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    clearCache() {
        return asyncHandler(
            async (req: AuthRequest, _res: Response, next: NextFunction) => {
                const key = `user:${req.user?.id}:orders`;

                await redisClient.del(key);

                return next();
            }
        );
    }

    clearIndividualCache() {
        return asyncHandler(
            async (req: AuthRequest, _res: Response, next: NextFunction) => {
                const key = `order:${req.params.id}`;

                await redisClient.del(key);
                return next();
            }
        );
    }

    clearIndividualCacheDetails() {
        return asyncHandler(
            async (req: AuthRequest, _res: Response, next: NextFunction) => {
                const key = `order:details:${req.params.id}`;

                await redisClient.del(key);

                return next();
            }
        );
    }
}

export default OrderRedisMiddleware;