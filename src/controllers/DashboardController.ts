import { Request, Response } from "express";
import DashboardService from "../services/DashboardService";
import { AuthRequest } from "../middlewares/Auth";

class DashboardController {
    static async getDashboardStats(req: AuthRequest, res: Response) {
        const farmId = req.user!.farmId || 0;
        const data = await DashboardService.getDashboardStats(farmId);

        return res.status(200).json({
            status: true,
            message: "Dashboard stats fetched successfully",
            data
        });
    }
}

export default DashboardController;