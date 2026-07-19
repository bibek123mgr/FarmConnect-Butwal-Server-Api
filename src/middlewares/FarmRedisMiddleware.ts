import { NextFunction, Response } from "express";
import redisClient from "../redis/redis";
import { AuthRequest } from "./Auth";
import { asyncHandler } from "../utils/asyncHandler";


class FarmRedisMiddleware {

    static getTopFarms() {
        return asyncHandler(async (_req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `farm:topfarms`;
            const topFarms = await redisClient.get(key);
            if (!topFarms) {
                return next();
            }
            return res.status(200).json({
                success: true,
                message: "Top farms fetched successfully",
                data: JSON.parse(topFarms),
            });
        });
    }

    static getAll(){
        return asyncHandler(async (_req: AuthRequest, res: Response, next: NextFunction) => {
            const key = `farm:all`;
            const farms = await redisClient.get(key);
            if (!farms) {
                return next();
            }
            return res.status(200).json({
                success: true,
                message: "Farms fetched successfully",
                data: JSON.parse(farms),
            });
        });
    }
}

export default FarmRedisMiddleware;