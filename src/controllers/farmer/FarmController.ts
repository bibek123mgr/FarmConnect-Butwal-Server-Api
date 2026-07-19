import { Response, Request } from "express";
import { AuthRequest } from "../../middlewares/Auth";
import FarmService from "../../services/farmer/FarmService";
import { asyncHandler } from "../../utils/asyncHandler";
import { uploadToCloudinary } from "../../middlewares/MulterConfig";

class FarmController {
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

        const dataObj = {
            userId,
            image,
            ...req.body,
        }

        const farm = await FarmService.createFarm(dataObj);

        return res.status(201).json({
            status: true,
            message: "Farm created successfully",
            data: farm,
        });
    });

    static getAll = asyncHandler(async (_req: Request, res: Response) => {
        const farms = await FarmService.getAllFarms();

        return res.status(200).json({
            status: true,
            message: "All farms fetched successfully",
            data: farms,
        });
    });

    static getTopFarms = asyncHandler(async (_req: Request, res: Response) => {
        const farms = await FarmService.getTopFarms();
        return res.status(200).json({
            status: true,
            message: "Top farms fetched successfully",
            data: farms,
        });
    });

    static getById = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = req.user!.farmId!;
        if (!id) {
            return res.status(404).json({
                status: false,
                message: "Farm not found",
            });
        }

        const farm = await FarmService.getFarmById(id);

        return res.status(200).json({
            status: true,
            message: "Farm fetched successfully",
            data: farm,
        });
    });

    static getMyFarms = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;

        const farms = await FarmService.getFarmsByUser(userId);

        return res.status(200).json({
            status: true,
            message: "My farms fetched successfully",
            data: farms,
        });
    });

    static update = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);

        const farm = await FarmService.updateFarm(id, req.body);

        return res.status(200).json({
            status: true,
            message: "Farm updated successfully",
            data: farm,
        });
    });

    static delete = asyncHandler(async (req: AuthRequest, res: Response) => {
        const id = Number(req.params.id);

        await FarmService.deleteFarm(id);
        return res.status(200).json({
            status: true,
            message: "Farm deleted successfully",
        });
    });
}

export default FarmController;