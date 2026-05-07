import { Router } from "express"

const router=Router()
import NotificationController from "../controllers/NotificationController"
import { Auth } from "../middlewares/Auth"

router.route("/notifications")
    .get(
        Auth,
        NotificationController.getNotifications
    )

router.route("/notifications/mark-as-read")
    .post(
        Auth,
        NotificationController.markAsRead
    )

export default router