import express, { NextFunction, Request, Response } from "express";
import { AuthRoute, CartRoute, DamageRoute, FarmRoute, OrderRoute, PaymentRoute, ProductCategoryRoute, ProductionRoute, ProductPriceRoute, ProductRoute } from "./routes/index";
import { config } from "./config/index";
import { errorHandler } from "./utils/error.middleware";

const app = express();

const NODE_ENV = config.NODE_ENV || "development";

app.use(express.json());


app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.originalUrl}`);
    return next();
});

app.get("/", (_req: Request, res: Response) => {
    res.send(`🚀 app is running in ${NODE_ENV} mode`);
});

app.use("/api/auth", AuthRoute);
app.use("/api", PaymentRoute);

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