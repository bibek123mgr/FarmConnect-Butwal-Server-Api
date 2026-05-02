import { Sequelize } from "sequelize";
import Comment from "../models/CommentModel";
import User from "../models/UserModel";
import { NotFoundError } from "../utils/errors";
import redisClient from "../redis/redis";


export interface ICreateComment {
    productId: number;
    comment: string;
    rating: number;
    createdBy: number;
}

export interface IUpdateComment {
    comment?: string;
    rating?: number;
    isActive?: boolean;
}

class CommentService {

    static async createComment(data: ICreateComment) {
        const comment = await Comment.create({
            productId: data.productId,
            comment: data.comment,
            rating: data.rating,
            createdBy: data.createdBy,
            isActive: true
        });
        await redisClient.del(`product:comments:${data.productId}`);
        return comment;
    }

    static async getCommentsByProduct(productId: number) {
        const comments = await Comment.findAll({
            attributes: [
                "id",
                "comment",
                "rating",
                "createdBy",
                "createdAt",
                [Sequelize.col("user.name"), "createdByName"]
            ],
            where: { productId, isActive: true },
            include: [
                { model: User, attributes: [] }
            ],
            order: [["createdAt", "DESC"]],
        });

        await redisClient.set(
            `product:comments:${productId}`,
            JSON.stringify(comments)
        );

        return comments;
    }

    static async getCommentsByStatus(isActive: boolean) {
        return await Comment.findAll({
            where: { isActive },
            order: [["createdAt", "DESC"]],
        });
    }

    static async getCommentById(id: number) {
        const comment = await Comment.findByPk(id);

        if (!comment) {
            throw new NotFoundError("Comment not found");
        }

        return comment;
    }

    static async updateComment(id: number, data: IUpdateComment) {
        const comment = await Comment.findByPk(id);

        if (!comment) {
            throw new NotFoundError("Comment not found");
        }

        await comment.update(data);
        await redisClient.del(`product:comments:${comment.productId}`);
        return comment;
    }

    static async deleteComment(id: number) {
        const comment = await Comment.findByPk(id);

        if (!comment) {
            throw new NotFoundError("Comment not found");
        }

        await comment.update({ isActive: false });
         await redisClient.del(`product:comments:${comment.productId}`);
        return true;
    }
}

export default CommentService;