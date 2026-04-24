import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server;
let onlineUsers: Map<string, string> = new Map();

export const initSocket = (server: HttpServer): Server => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("register", (userId: string) => {
            onlineUsers.set(userId, socket.id);
            console.log("Online users:", onlineUsers);
            console.log(`User ${userId} registered with socket ID ${socket.id}`);
        });

        socket.on("disconnect", () => {
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`User ${userId} disconnected and removed from online users`);
                    break;
                }
            }
        });
    });

    return io;
};

export const getIO = (): Server => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};


export const isUserOnline = (userId: string): string | undefined => {
    console.log(onlineUsers)
    return onlineUsers.get(userId);
};

export const sendNotificationToUser = (
    userId: string,
    event: string,
    data: any
) => {
    const io = getIO();
    const socketId = isUserOnline(userId)
    console.log(`Checking online status for user ${userId}: ${socketId ? "Online" : "Offline"}`);
    if (socketId) {
        console.log(`Sending event '${event}' to user ${userId} with socket ID ${socketId}`);
        io.to(socketId).emit(event, data);
    }
};

export const broadcastNotification = (event: string, data: any) => {
    const io = getIO();
    io.emit(event, data);
};