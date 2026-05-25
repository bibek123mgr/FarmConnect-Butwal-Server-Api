import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ProductService from "../../services/farmer/ProductService";
import { AuthRequest } from "../../middlewares/Auth";

class ProductController {
    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        const { name, description, unit, rate, quantity, categoryId } = req.body;
        const userId = req.user!.id;
        const farmId = req.user!.farmId;
        const file = req.file;
        const image = file?.filename;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Image is required",
            });
        }
        await ProductService.createProduct({
            userId,
            name,
            description,
            unit,
            rate,
            quantity,
            categoryId,
            farmId,
            image
        });

        return res.status(201).json({
            status: true,
            message: "Product created successfully"
        });
    });

    static getAll = asyncHandler(async (req: Request, res: Response) => {
        const data = req.query
        const products = await ProductService.getAllProducts(data);

        return res.status(200).json({
            status: true,
            data: products,
        });
    });

    static getTopSellingProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
        const products = await ProductService.getTopSellingProducts();
        return res.status(200).json({
            status: true,
            message: "Top selling products fetched successfully",
            data: products,
        });
    });

    static getAllMyProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id
        const data = req.query
        const products = await ProductService.getAllMyProducts({
            ...data,
            userId
        });
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
        const file = req.file;
        if (file) {
            req.body.image = file.filename
        }
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