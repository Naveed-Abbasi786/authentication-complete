import { Router } from "express";
import { login, logout, refreshToken, registerUser, resendOtp, verifyUser } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewears/auth.middlewares.js";

const router=Router()

router.route("/register").post(registerUser)
router.route("/verify-otp").post(verifyUser)
router.route("/resend-otp").post(resendOtp)
router.route("/login").post(login)
router.route("/logout").post(verifyJwt,logout)
router.route("/refresh-token").post(verifyJwt,refreshToken)
export default router;