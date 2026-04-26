import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../models/User.js";
import { isDatabaseReady } from "../config/db.js";
import { readUsers, writeUsers } from "../lib/localStore.js";

const router = express.Router();

function buildToken(userId) {
  const secret = process.env.JWT_SECRET || "ai-smart-farming-dev-secret";
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (isDatabaseReady()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });
    } else {
      const users = await readUsers();
      const existingUser = users.find((item) => item.email === normalizedEmail);

      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      user = {
        _id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      };

      users.push(user);
      await writeUsers(users);
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = null;

    if (isDatabaseReady()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const users = await readUsers();
      user = users.find((item) => item.email === normalizedEmail) || null;
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = buildToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
