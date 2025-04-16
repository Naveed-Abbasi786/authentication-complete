import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
export const app = express();

dotenv.config({
  path: "./.env",
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));
import userRoutes from "./routes/user.route.js";

app.use("/api/users", userRoutes);