import "dotenv/config";
import express from "express";
import {
  createNewUser,
  findUserDetails,
  updateUserProfile,
} from "../../controllers/dynamodb/userController.js";
import { validateRequest } from "../validate/validator.js";
import { loginSchema } from "../validate/validator.js";
import { loginHandler } from "../../controllers/dynamodb/authController.js";
import { signUpSchema } from "../validate/validator.js";
import authenticateToken from "../../middlewares/authenticateToken.js";
const authRouter = express.Router();

authRouter.post("/login", validateRequest(loginSchema), loginHandler);
// authRouter.post("logout", logoutHandler);
authRouter.post("/signup", validateRequest(signUpSchema), createNewUser);
authRouter.get("/user", authenticateToken, findUserDetails);
authRouter.put("/user/profile", authenticateToken, updateUserProfile);

export default authRouter;
