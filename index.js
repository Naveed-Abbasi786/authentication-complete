import { app } from "./src/app.js";
import dotenv from "dotenv";
import connectDb from "./src/config/db.config.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 5000;

app.on("error", (error) => {
  console.error("App Error:", error);
  throw error;
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });
