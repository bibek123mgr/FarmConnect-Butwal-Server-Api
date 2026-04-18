import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthRequest } from "../../middlewares/Auth";
import DamageService from "../../services/farmer/DamageService";

class DamageController {

    static create = asyncHandler(async (req: AuthRequest, res: Response) => {
        await DamageService.createDamage({
            productId: req.body.productId,
            farmId: req.body.farmId,
            quantity: req.body.quantity,
            reason: req.body.reason,
            lossAmount: req.body.lossAmount,
            remarks: req.body.remarks,
            userId: req.user!.id
        });

        res.status(201).json({
            status: true,
            message: "Damage recorded successfully"
        });
    });

    static getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
        const data = await DamageService.getAllDamages(req.user!.id);

        res.status(200).json({
            status: true,
            data
        });
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const data = await DamageService.getDamageById(Number(req.params.id));

        res.status(200).json({
            status: true,
            data
        });
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        await DamageService.deleteDamage(Number(req.params.id));

        res.status(200).json({
            status: true,
            message: "Damage deleted successfully"
        });
    });
}

export default DamageController;