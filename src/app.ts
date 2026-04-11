import express, { Request, Response } from "express";
import { AuthRoute, FarmRoute } from "./routes/index";
import { config } from "./config/index";
import { errorHandler } from "./utils/error.middleware";

const app = express();

const NODE_ENV = config.NODE_ENV || "development";

app.use(express.json());


app.use((req: Request, _res: Response, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    console.log("Body:", req.body);
    return next();
});

app.get("/", (_req: Request, res: Response) => {
    res.send(`🚀 app is running in ${NODE_ENV} mode`);
});

app.use("/api/auth", AuthRoute);
app.use("/api", FarmRoute);
app.use(errorHandler);

export default app;