import { app } from "./src/app.js";
import dotenv from "dotenv";




dotenv.config({
  path: "./.env",
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
