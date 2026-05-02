import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/Auth";
import CommentService from "../services/CommentService";

class CommentController {

    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;

        const comment = await CommentService.createComment({
            createdBy: userId,
            ...req.body,
        });
        

        return res.status(201).json({
            status: true,
            message: "Comment created successfully",
            data: comment,
        });
    });

    static getByProduct = asyncHandler(async (req: Request, res: Response) => {
        const productId = Number(req.params.productId);

        const comments = await CommentService.getCommentsByProduct(productId);

        return res.status(200).json({
            status: true,
            message: "Comments by product fetched successfully",
            data: comments,
        });
    });

    static getByStatus = asyncHandler(async (req: Request, res: Response) => {
        const isActive = req.params.status === "true";

        const comments = await CommentService.getCommentsByStatus(isActive);

        return res.status(200).json({
            status: true,
            message: "Comments by status fetched successfully",
            data: comments,
        });
    });

    static update = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);

        const comment = await CommentService.updateComment(id, req.body);

        return res.status(200).json({
            status: true,
            message: "Comment updated successfully",
            data: comment,
        });
    });

    static delete = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);

        await CommentService.deleteComment(id);

        return res.status(200).json({
            status: true,
            message: "Comment deleted successfully",
        });
    });
}

export default CommentController;