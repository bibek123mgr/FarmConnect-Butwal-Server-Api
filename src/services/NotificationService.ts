import Notification from "../models/NotificationModel";


class NotificationService {
    static async getNotifications(userId: number) {
        const notifications = await Notification.findAll({
            attributes: [
                "id",
                "message",
                "isRead"
            ],
            where: { userId, isActive: true },
            order: [["createdAt", "DESC"]],
        });
        return notifications;
    }

    static async makeReadNotification(userId: number) {
        await Notification.update(
            {
                isRead: true
            },
            { where: { userId, isRead: false } }
        )

        return true;
    }
}

export default NotificationService;