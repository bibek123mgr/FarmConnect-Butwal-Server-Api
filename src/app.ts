import express, { NextFunction, Request, Response } from "express";
import { AuthRoute, CartRoute, CommentRoute, DamageRoute, FarmRoute, NotificationRoute, OrderRoute, ProductCategoryRoute, ProductionRoute, ProductPriceRoute, ProductRoute, UserRoute } from "./routes/index";
import { config } from "./config/index";
import { errorHandler } from "./utils/error.middleware";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";
import cors from "cors";
import { multerErrorHandler } from "./middlewares/multerErrorHandler";
import path from "path";
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
app.use(
    "/image",
    express.static(path.join(process.cwd(), "public/images"))
); app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    UserRoute,
    ProductRoute,
    CommentRoute,
    NotificationRoute,
    ProductCategoryRoute,
    OrderRoute,
    CartRoute,
    DamageRoute,
    ProductionRoute,
    ProductPriceRoute);

app.use(multerErrorHandler);
app.use(errorHandler);

export default app;