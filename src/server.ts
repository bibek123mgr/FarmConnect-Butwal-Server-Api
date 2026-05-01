import app from "./app";
import { initDB } from "./config/database";
import { config } from "./config/index";
import { initSocket } from "./socket/socket";

const PORT = Number(config.PORT) || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
}); 

initSocket(server);

server.on("listening", async () => {
    await initDB();
});
server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} already in use`);
    } else {
        console.error("❌ Server error:", err);
    }
});