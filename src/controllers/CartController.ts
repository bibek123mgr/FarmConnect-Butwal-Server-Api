import { Response, Request } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/Auth";
import CartService from "../services/CartServices";

class CartController {
    static add = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;
     
        await CartService.addToCart({
            userId,
            ...req.body,
        });

        return res.status(201).json({
            status: true,
            message: "Item added to cart"
        });
    });

    static getMyCart = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;

        const cart = await CartService.getMyCart(userId);

        return res.status(200).json({
            status: true,
            message: "Cart fetched successfully",
            data: cart,
        });
    });

    static update = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        await CartService.updateCart(id, req.body);

        return res.status(200).json({
            status: true,
            message: "Cart updated successfully"
        });
    });

    static remove = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);

        await CartService.removeCart(id);

        return res.status(200).json({
            status: true,
            message: "Item removed from cart",
        });
    });

    static clear = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user!.id;
     
        await CartService.clearCart(userId);

        return res.status(200).json({
            status: true,
            message: "Cart cleared successfully",
        });
    });
}

export default CartController;