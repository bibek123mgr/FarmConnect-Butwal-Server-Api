import { Response, Request } from "express";
import { AuthRequest } from "../../middlewares/Auth";
import { asyncHandler } from "../../utils/asyncHandler";
import ProductCategoryService from "../../services/admin/ProductCategoryService";
import { uploadToCloudinary } from "../../middlewares/MulterConfig";

class ProductCategoryController {
    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image is required",
            });
        }
        const result: any = await uploadToCloudinary(file);
        const image = result.url;

        const dateObj = {
            createdBy: userId,
            image,
            ...req.body,
        }

        console.log("Data to be sent to service:", dateObj); // Log the data to be sent to the service for debugging


        await ProductCategoryService.createCategory(dateObj);

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

    static stats = asyncHandler(async (_req: Request, res: Response) => {
        const data = await ProductCategoryService.stats();
        return res.status(200).json({
            status: true,
            message: "Category deleted successfully",
            data
        });
    });
}

export default ProductCategoryController;