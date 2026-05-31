import VendorServices from "../../services/farmer/VendorServices";
import { asyncHandler } from "../../utils/asyncHandler";
import { Request, Response } from "express";

class VendorController {
    static getAllVendors = asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, search, status } = req.query;
        const data = await VendorServices.getAllVendors({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search ? String(search) : undefined,
            status: status ? Boolean(status) : undefined
        });

        return res.status(200).json({
            status: true,
            message: "Vendors fetched successfully",
            ...data
        });
    })

    static async getStats(_req: Request, res: Response) {
        const data = await VendorServices.getStats();
        return res.status(200).json({
            status: true,
            message: "Stats fetched successfully",
            data
        });
    }
}

export default VendorController;