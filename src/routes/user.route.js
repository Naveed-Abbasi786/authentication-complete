import { Router } from "express";
import passport from "passport";
import {
  forgetPassword,
  login,
  loginSuccess,
  logout,
  refreshToken,
  registerUser,
  resendOtp,
  resetPassword,
  verifyUser,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewears/auth.middlewares.js";

const router = Router();

// 👤 Normal Auth Routes
router.post("/register", registerUser);
router.post("/verify-otp", verifyUser);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/logout", verifyJwt, logout);
router.post("/forget-Password",forgetPassword)
router.post("/reset-password",resetPassword)
router.post("/refresh-token", verifyJwt, refreshToken);

function isLoggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // ✅ Required scopes
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: false,
  }),
  loginSuccess
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failure",
    session: false,
  }),
  (req, res) => {
    console.log("User from Google:", req.user);
    res.send("Login Successful!");
  }
);

router.get("/google/failure", (req, res) => {
  res.status(401).json({ error: "Google Auth Failed" });
});

router.get("/protected", isLoggedIn, (req, res) => {
  res.send(`Hello ${req.user.name}`);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
});
export default router;
