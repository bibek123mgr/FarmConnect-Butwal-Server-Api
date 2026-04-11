import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "../../middlewares/Auth";
import FarmService from "../../services/farmer/FarmService";

class FarmController {
    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const {
                farmName,
                description,
                province,
                district,
                address,
                logo,
                panNo,
                vatNo
            } = req.body;

            const data = {
                userId,
                farmName,
                description,
                province,
                district,
                address,
                logo,
                panNo,
                vatNo
            };

            const farm = await FarmService.createFarm(data);

            return res.status(201).json({
                message: "Farm created successfully",
                farm,
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }

    static async getAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const farms = await FarmService.getAllFarms();
            return res.status(200).json({
                message: "All farms fetched successfully",
                farms,
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);

            const farm = await FarmService.getFarmById(id);

            if (!farm) {
                return res.status(404).json({
                    message: "Farm not found",
                });
            }

            return res.status(200).json({
                message: "Farm fetched successfully",
                farm,
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }

    static async getMyFarms(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;

            const farms = await FarmService.getFarmsByUser(userId);

            return res.status(200).json({
                message: "My farms fetched successfully",
                farms,
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const {
                farmName,
                description,
                province,
                district,
                address,
                logo,
                panNo,
                vatNo,
                isActive,
                isVerified
            } = req.body;

            const data = {
                farmName,
                description,
                province,
                district,
                address,
                logo,
                panNo,
                vatNo,
                isActive,
                isVerified
            };

            const farm = await FarmService.updateFarm(id, data);

            if (!farm) {
                return res.status(404).json({
                    status: false,
                    message: "Farm not found",
                });
            }

            return res.status(200).json({
                status: true,
                message: "Farm updated successfully",
                farm,
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);

            const deleted = await FarmService.deleteFarm(id);

            if (!deleted) {
                return res.status(404).json({
                    status: false,
                    message: "Farm not found",
                });
            }

            return res.status(200).json({
                status: true,
                message: "Farm deleted successfully",
            });
        } catch (error) {
            res.status(500).json({
                message: "Server error",
                status: false
            })
            return next(error);
        }
    }
}

export default FarmController;