import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/Auth";
import { asyncHandler } from "../../utils/asyncHandler";
import ProductPriceService from "../../services/farmer/ProductPriceServices";

class ProductPriceController {

    static createOrUpdate = asyncHandler(async (req: AuthRequest, res: Response) => {
        console.log(req.body);
        await ProductPriceService.createOrUpdatePrice({
            productId: req.body.productId,
            farmId: req.body.farmId,
            type: req.body.type,
            price: req.body.price,
            title: req.body.title,
            effectiveFrom: req.body.effectiveFrom,
            effectiveTo: req.body.effectiveTo,
            userId: req.user!.id
        });

        res.status(200).json({
            status: true,
            message: "Price saved successfully"
        });
    });

    static getPrice = asyncHandler(async (req: Request, res: Response) => {
        const data = await ProductPriceService.getPrice(
            Number(req.params.productId),
            Number(req.params.farmId)
        );

        res.status(200).json({ status: true, data });
    });

    static getProductPrices = asyncHandler(async (req: AuthRequest, res: Response) => {
        const farmId = req.user!.farmId || 0;
        const data = await ProductPriceService.getProductPrices(
            farmId
        );
        res.status(200).json({ status: true, data });
    });
}

export default ProductPriceController;