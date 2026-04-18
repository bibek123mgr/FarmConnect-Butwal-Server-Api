import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middlewares/Auth";
import ProductionService from "../../services/farmer/ProductionService";

class ProductionController {

    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        await ProductionService.createProduction({
            productId: req.body.productId,
            farmId: req.body.farmId,
            quantity: req.body.quantity,
            costPerUnit: req.body.costPerUnit,
            remarks: req.body.remarks,
            userId: req.user!.id
        });

        res.status(201).json({
            status: true,
            message: "Production created successfully"
        });
    });

    static update = asyncHandler(async (req: Request, res: Response) => {
        await ProductionService.updateProduction(Number(req.params.id), req.body);

        res.status(200).json({
            status: true,
            message: "Production updated successfully"
        });
    });

    static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
        const data = await ProductionService.getAllProductions(req.user!.id);

        res.status(200).json({
            status: true,
            data
        });
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const data = await ProductionService.getProductionById(Number(req.params.id));

        res.status(200).json({
            status: true,
            data
        });
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        await ProductionService.deleteProduction(Number(req.params.id));

        res.status(200).json({
            status: true,
            message: "Production deleted successfully"
        });
    });
}

export default ProductionController;