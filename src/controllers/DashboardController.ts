import { Request, Response } from "express";
import DashboardService from "../services/DashboardService";

class DashboardController {
    static async getDashboardStats(req: Request, res: Response) {
        const data = await DashboardService.getDashboardStats();

        return res.status(200).json({
            status: true,
            message: "Dashboard stats fetched successfully",
            data
        });
    }
}

export default DashboardController;