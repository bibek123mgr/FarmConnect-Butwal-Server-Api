import { Response, Request } from "express";
import { AuthRequest } from "../../middlewares/Auth";
import { asyncHandler } from "../../utils/asyncHandler";
import ProductCategoryService from "../../services/admin/ProductCategoryService";

class ProductCategoryController {
    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;

        await ProductCategoryService.createCategory({
            createdBy: userId,
            ...req.body,
        });

        return res.status(201).json({
            status: true,
            message: "Category created successfully"
        });
    });

    static getAll = asyncHandler(async (_req: Request, res: Response) => {
        const data = await ProductCategoryService.getAllCategories();
        return res.status(200).json({
            status: true,
            message: "All categories fetched successfully",
            data
        });
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const data = await ProductCategoryService.getCategoryById(id);
        return res.status(200).json({
            status: true,
            message: "Category fetched successfully",
            data
        });
    });

    static update = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);
        await ProductCategoryService.updateCategory(id, req.body);
        return res.status(200).json({
            status: true,
            message: "Category updated successfully"
        });
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        await ProductCategoryService.deleteCategory(id);
        return res.status(200).json({
            status: true,
            message: "Category deleted successfully",
        });
    });
}

export default ProductCategoryController;