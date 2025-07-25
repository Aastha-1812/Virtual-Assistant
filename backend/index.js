import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connect from "./config/db.js";
import authRouter from "./routes/auth.router.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.router.js";
import geminiResponse from "./gemini.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(port, () => {
  connect();
  console.log("server started");
});
