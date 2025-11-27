import { UserRepository } from "../../models/dynamodb/user-repository.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  hasAdminPrivileges,
  hasSuperAdminPrivileges,
} from "../../utils/constants.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const loginHandler = async (req, res) => {
  const { email, password } = req.value.body;

  try {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check account status
    if (user.accountStatus !== "active") {
      return res.status(403).json({
        message: "Account is not active",
        accountStatus: user.accountStatus,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Update failed login attempts
      await UserRepository.updateLoginTracking(user.userId, false);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update successful login tracking
    await UserRepository.updateLoginTracking(user.userId, true);

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        userId: user.userId,
        id: user.userId, // Keep for backward compatibility
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        bio: user.bio || null,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isAdmin: hasAdminPrivileges(user.role),
        isSuperAdmin: hasSuperAdminPrivileges(user.role),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "login error",
      error: error.message,
    });
  }
};

const generateToken = (user) => {
  try {
    return jwt.sign(
      {
        sub: user.userId,
        role: user.role,
        email: user.email,
        name: user.name,
        isAdmin: hasAdminPrivileges(user.role),
        isSuperAdmin: hasSuperAdminPrivileges(user.role),
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
        algorithm: "HS256",
      }
    );
  } catch (error) {
    throw new Error("Error generating token", error.message);
  }
};
