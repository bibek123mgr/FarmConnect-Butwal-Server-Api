import { Router } from "express";
import CommentController from "../controllers/CommentController";
import CommentRedisMiddleware from "../middlewares/CommentRedisMiddleware";
import { Auth } from "../middlewares/Auth";

const router = Router();
const commentRedisMiddleware = new CommentRedisMiddleware();

router
    .route("/comments")
    .post(
        Auth,
        CommentController.create
    );


router.
    route("/comments/product/:id")
    .get(
        commentRedisMiddleware.getCommentsByProduct,
        CommentController.getByProduct
    )

router
    .route("/comments/:id")
    .put(
        Auth,
        CommentController.update
    )
    .delete(
        Auth,
        CommentController.delete
    );


export default router;