import redisClient from "../redis/redis";
import { Request, Response, NextFunction } from "express";


class CommentRedisMiddleware {
    public async getCommentsByProduct(req: Request, res: Response, next: NextFunction) {
        const productId = Number(req.params.productId);
        const cachedComments = await redisClient.get(`product:comments:${productId}`);
        if (cachedComments) {
            res.status(200).json({
                status: true,
                message: "Comments by product fetched successfully",
                data: JSON.parse(cachedComments),
            });
        }
        next();
    } 
}

export default CommentRedisMiddleware;