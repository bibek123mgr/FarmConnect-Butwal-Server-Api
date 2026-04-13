import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ProductService from "../../services/farmer/ProductModel";
import { AuthRequest } from "../../middlewares/Auth";

class ProductController {
    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { name, description, unit, rate, quantity, categoryId } = req.body;
        const userId = req.user!.id;
        const farmId = req.user!.farmId;
        await ProductService.createProduct({
            userId,
            name,
            description,
            unit,
            rate,
            quantity,
            categoryId,
            farmId
        });

        return res.status(201).json({
            status: true,
            message: "Product created successfully"
        });
    });

    static getAll = asyncHandler(async (_req: Request, res: Response) => {
        const products = await ProductService.getAllProducts();
        return res.status(200).json({
            status: true,
            data: products,
        });
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        const product = await ProductService.getProductById(id);

        return res.status(200).json({
            status: true,
            data: product,
        });
    });

    static update = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);

       await ProductService.updateProduct(id, req.body);

        return res.status(200).json({
            status: true,
            message: "Product updated successfully"
        });
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        await ProductService.deleteProduct(id);

        return res.status(200).json({
            status: true,
            message: "Product deleted successfully",
        });
    });
}

export default ProductController;