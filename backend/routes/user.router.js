import express from "express";
import getCurrentUser, {
  askToAssistant,
  updateAssistant,
} from "../controllers/user.controller.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("file"), updateAssistant); //here multer middleware will only work if there is file uploaded apart from the default 7 images.
userRouter.post("/askassistant", isAuth, askToAssistant);

export default userRouter;
