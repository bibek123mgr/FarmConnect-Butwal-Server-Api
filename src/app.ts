import express, { NextFunction, Request, Response } from "express";
import { AuthRoute, CartRoute, DamageRoute, FarmRoute, OrderRoute, ProductCategoryRoute, ProductionRoute, ProductPriceRoute, ProductRoute } from "./routes/index";
import { config } from "./config/index";
import { errorHandler } from "./utils/error.middleware";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
const NODE_ENV = config.NODE_ENV || "development";

const app = express();

const limiter = rateLimit({
    windowMs: 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later."
});

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://192.168.1.46:5173"
    ], credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(limiter);

app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.originalUrl}`);
    return next();
});

app.get("/", (_req: Request, res: Response) => {
    res.send(`🚀 app is running in ${NODE_ENV} mode`);
});

app.use("/api/auth", AuthRoute);
app.use("/api/farmers", FarmRoute);
app.use("/api",
    ProductRoute,
    ProductCategoryRoute,
    OrderRoute,
    CartRoute,
    DamageRoute,
    ProductionRoute,
    ProductPriceRoute);

app.use(errorHandler);

export default app;