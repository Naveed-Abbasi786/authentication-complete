import { Router } from "express";
import { verifyJwt } from "../middlewears/auth.middlewares.js";
import { addComment, replyComments, updateComment, nestedReply} from "../controllers/commentBlog.controller.js";

const router=Router()

router.post("/add",verifyJwt,addComment)
router.put("/update",verifyJwt,updateComment)
router.post("/reply",verifyJwt,replyComments)
router.post("/nested-reply",verifyJwt,nestedReply)


export default router