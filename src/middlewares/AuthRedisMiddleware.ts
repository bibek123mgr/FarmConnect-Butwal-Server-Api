import { NextFunction,Response } from "express";
import { AuthRequest } from "./Auth";
import redisClient from "../redis/redis";

class AuthRedisMiddleware {
    clearUserCache() {
       return async (req: AuthRequest, _res: Response, next: NextFunction) => {
           const key = `user:profile:${req.user?.id}`;
           await redisClient.del(key);
           next();
       }
    }
    getMyProfileFromCache() {
       return async (req: AuthRequest, res: Response, next: NextFunction) => {
           const key = `user:profile:${req.user?.id}`;
           const profile = await redisClient.get(key);
           if (!profile) {
               return next();
           }
           const user = JSON.parse(profile);
           return res.status(200).json({
               success: true,
               user
           });
       }
    }
}

export default AuthRedisMiddleware;