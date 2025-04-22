import { Router } from "express";
import { verifyJwt } from "../middlewears/auth.middlewares.js";
import { addcategory, categoryDelete, categoryUpdate, getAllCategories, getUserCategories } from "../controllers/category.controller.js";

const router=Router()

router.route("/create").post(verifyJwt,addcategory)
router.get("/get-all-categories",verifyJwt,getAllCategories)
router.get("/get-user-categories",verifyJwt,getUserCategories)
router.put("/update",verifyJwt,categoryUpdate)
router.delete("/delete",verifyJwt,categoryDelete)

export default router