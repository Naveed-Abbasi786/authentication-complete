import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import "./config/passport.config.js";

dotenv.config({ path: "./.env" });

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false, 
  cookie: { 
    maxAge: 3600000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
import userRoutes from "./routes/user.route.js";
import categoryRoutes from './routes/category.route.js'
import blogRoutes from './routes/blog.route.js'
import commentBlogRoute from './routes/commentBlog.route.js'
app.use("/api/auth", userRoutes);
app.use("/api/blog/category",categoryRoutes)
app.use("/api/blog/",blogRoutes)
app.use("/api/blog/comment",commentBlogRoute)



// Global error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    error: err.error || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
