import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import redisClient from "../redis/redis";
import { IgetAllProductsFilter } from "../services/farmer/ProductService";

type ProductRequest = Request<{}, {}, {}, IgetAllProductsFilter>;




class ProductStockRedisMiddleware {
    getCachedProductStock() {
        return asyncHandler(
            async (req: ProductRequest, res: Response, next: NextFunction) => {

                const data = (req as ProductRequest).query;
                const {
                    productname,
                    category,
                    page = 1,
                    limit = 20,
                    pricerangeFrom,
                    pricerangeTo,
                    store
                } = data;

                const cacheKey = `products:stock:page=${page}:limit=${limit}:name=${productname || "all"}:category=${category || "all"}:from=${pricerangeFrom || 0}:to=${pricerangeTo || "max"}:store=${store || "all"}`;
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    const data = JSON.parse(cachedData);

                    return res.status(200).json({
                        status: true,
                        message: "Product stock fetched successfully",
                        ...data
                    });
                }

                return next();
            }
        );
    }

    getCachedTopSellingProductStock() {
        return asyncHandler(
            async (_req: ProductRequest, res: Response, next: NextFunction) => {

                const cacheKey = `products:topsellingproducts`;
                const cachedData = await redisClient.get(cacheKey);

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Top selling products fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }


    clearProductStockCache() {
        return asyncHandler(
            async (_req: Request, _res: Response, next: NextFunction) => {
                const key = `products:stock:all`;
                await redisClient.del(key);
                return next();
            }
        );
    }

    getCachedProductStockById() {
        return asyncHandler(
            async (req: Request, res: Response, next: NextFunction) => {
                const key = `product:stock`;
                const id = req.params?.id
                const cachedData = await redisClient.hget(key, id.toString());

                if (cachedData) {
                    return res.status(200).json({
                        status: true,
                        message: "Product stock fetched successfully",
                        data: JSON.parse(cachedData),
                    });
                }

                return next();
            }
        );
    }

    clearProductStockCacheById() {
        return asyncHandler(
            async (req: Request, _res: Response, next: NextFunction) => {
                const key = `products:stock`;
                const id = req.params?.id
                await redisClient.hdel(key, id.toString());
                return next();
            }
        );
    }

    // getProductIdAndClearCacheById() {
    //     return asyncHandler(
    //         async (req: Request, res: Response, next: NextFunction) => {
    //             const key = `products:stock`;
    //             const id = req.params?.id
    //             await redisClient.hdel(key, id.toString());
    //             res.locals.productId = id;
    //             return next();
    //         }
    //     );
    // }
}


export default ProductStockRedisMiddleware;