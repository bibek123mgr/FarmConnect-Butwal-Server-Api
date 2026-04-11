import express, { Request, Response } from "express";
import { config } from "./config";
import { initDB } from "./config/database";

const app = express();

const PORT = config.PORT || 5000;
const NODE_ENV = config.NODE_ENV || "development";

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send(`🚀 Server is running in ${NODE_ENV} mode`);
});

const startServer = async () => {
    try {
        await initDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();