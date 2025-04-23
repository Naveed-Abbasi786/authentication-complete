import { Router } from "express";
import { verifyJwt } from "../middlewears/auth.middlewares.js";
import { addComment, replyComments, updateComment } from "../controllers/commentBlog.controller.js";

const router=Router()

router.post("/add",verifyJwt,addComment)
router.post("/update",verifyJwt,updateComment)
router.post("/reply",verifyJwt,replyComments)

export default router