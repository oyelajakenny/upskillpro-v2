import { UserRepository } from "../../models/dynamodb/user-repository.js";
import bcrypt from "bcrypt";
import { validateUserRole } from "../../utils/validation.js";

const createNewUser = async (req, res) => {
  const { name, email, password, role } = req.value.body;

  try {
    // Validate role
    const roleValidation = validateUserRole(role);
    if (!roleValidation.isValid) {
      return res.status(400).json({
        message: roleValidation.error,
        code: roleValidation.code,
      });
    }

    const existingUser = await UserRepository.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: "User created successfully!",
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

const findUserDetails = async (req, res) => {
  try {
    const user = await UserRepository.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving user", error: err.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, email, currentPassword, newPassword } = req.body;

    // Get current user
    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};

    // Update name if provided
    if (name && name.trim() !== "") {
      updates.name = name.trim();
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if new email is already in use
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser && existingUser.userId !== userId) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updates.email = email;
      updates.GSI4PK = `EMAIL#${email}`;
    }

    // Update password if provided
    if (newPassword && newPassword.trim() !== "") {
      // Verify current password
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to set a new password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    // If no updates, return current user
    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        message: "No changes to update",
        user: {
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Update user
    const updatedUser = await UserRepository.update(userId, updates);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.userId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({
      message: "Error updating profile",
      error: err.message,
    });
  }
};

export { createNewUser, findUserDetails, updateUserProfile };
