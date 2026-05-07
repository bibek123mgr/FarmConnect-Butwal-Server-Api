import { AuthRequest } from "../middlewares/Auth";
import NotificationService from "../services/NotificationService";
import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

class NotificationController {

    static getNotifications = asyncHandler (async (req: AuthRequest, res: Response)=>{
        const notifications = await NotificationService.getNotifications(req.user!.id);
        return res.status(200).json({
            status: true,
            message: "Notifications fetched successfully",
            data: notifications,
        });
    })

    static markAsRead = asyncHandler (async (req: AuthRequest, res: Response) => {
        await NotificationService.makeReadNotification(req.user!.id);
        return res.status(200).json({
            status: true,
            message: "Notifications marked as read successfully",
        });
    })
}

export default NotificationController