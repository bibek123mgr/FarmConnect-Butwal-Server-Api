import app from "./app";
import { initDB } from "./config/database";
import { config } from "./config/index";

const PORT = config.PORT || 5000;

const server = app.listen(PORT);

server.on("listening", async () => {
    console.log(`✅ Server running on ${PORT}`);
    await initDB();
});

server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} already in use`);
    } else {
        console.error("❌ Server error:", err);
    }
});