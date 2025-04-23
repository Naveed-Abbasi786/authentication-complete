import { Router } from "express";
import { verifyJwt } from "../middlewears/auth.middlewares.js";
import {
  addBlog,
  allBlogs,
  deletBloge,
  updateBlog,
  userBlogs,
  blogDetails,
  likeDislikeToggle,
  publicPrivateToggle,
  softDelete
} from "../controllers/blog.controller.js";
import { upload } from "../middlewears/multer.middlewares.js";
const router = Router();

router.post("/add", upload.single("thumbnail"), verifyJwt, addBlog);
router.put("/update", upload.single("thumbnailUpdate"), verifyJwt, updateBlog);

router.get("/all-blogs", allBlogs);
router.get("/user-blogs", verifyJwt, userBlogs);
router.delete("/delete", verifyJwt, deletBloge);
router.get("/details/:slug", blogDetails);
router.post("/like-dislike",verifyJwt,likeDislikeToggle)
router.post("/public-private",verifyJwt,publicPrivateToggle)
router.delete("/soft-delete",verifyJwt,softDelete)

export default router;
