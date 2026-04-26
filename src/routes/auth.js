import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../../models/User.js";
import { isDatabaseReady } from "../config/db.js";
import { readUsers, writeUsers } from "../lib/localStore.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function buildToken(userId) {
  const secret = process.env.JWT_SECRET || "ai-smart-farming-dev-secret";
  return jwt.sign({ id: userId }, secret, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || "",
    provider: user.provider || "local",
    firebaseUid: user.firebaseUid || "",
    preferences: {
      theme: user.preferences?.theme || "light",
      locale: user.preferences?.locale || "en",
    },
  };
}

async function findUserById(id) {
  if (isDatabaseReady()) {
    return User.findById(id);
  }

  const users = await readUsers();
  return users.find((item) => item._id === id) || null;
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
        preferences: {
          theme: "light",
          locale: "en",
        },
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
        avatarUrl: "",
        provider: "local",
        firebaseUid: "",
        preferences: {
          theme: "light",
          locale: "en",
        },
      };

      users.push(user);
      await writeUsers(users);
    }

    return res.status(201).json({
      message: "User registered successfully",
      token: buildToken(user._id),
      user: sanitizeUser(user),
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
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const { name, email, avatarUrl = "", firebaseUid = "" } = req.body;

    if (!email || !firebaseUid) {
      return res.status(400).json({ message: "Email and firebaseUid are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user;

    if (isDatabaseReady()) {
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        user = await User.create({
          name: (name || normalizedEmail.split("@")[0]).trim(),
          email: normalizedEmail,
          avatarUrl,
          provider: "google",
          firebaseUid,
          preferences: {
            theme: "light",
            locale: "en",
          },
        });
      } else {
        user.name = (name || user.name).trim();
        user.avatarUrl = avatarUrl || user.avatarUrl || "";
        user.provider = "google";
        user.firebaseUid = firebaseUid;
        await user.save();
      }
    } else {
      const users = await readUsers();
      const existingIndex = users.findIndex((item) => item.email === normalizedEmail);

      if (existingIndex >= 0) {
        user = {
          ...users[existingIndex],
          name: (name || users[existingIndex].name).trim(),
          avatarUrl: avatarUrl || users[existingIndex].avatarUrl || "",
          provider: "google",
          firebaseUid,
          preferences: users[existingIndex].preferences || {
            theme: "light",
            locale: "en",
          },
        };
        users[existingIndex] = user;
      } else {
        user = {
          _id: crypto.randomUUID(),
          name: (name || normalizedEmail.split("@")[0]).trim(),
          email: normalizedEmail,
          password: "",
          avatarUrl,
          provider: "google",
          firebaseUid,
          preferences: {
            theme: "light",
            locale: "en",
          },
        };
        users.push(user);
      }

      await writeUsers(users);
    }

    return res.json({
      token: buildToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.put("/profile", requireAuth, async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const avatarUrl = typeof req.body.avatarUrl === "string" ? req.body.avatarUrl.trim() : "";
    const theme = typeof req.body.theme === "string" ? req.body.theme.trim() : "";
    const locale = typeof req.body.locale === "string" ? req.body.locale.trim() : "";

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    let user;

    if (isDatabaseReady()) {
      user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.name = name;
      user.avatarUrl = avatarUrl;
      user.preferences = {
        theme: theme || user.preferences?.theme || "light",
        locale: locale || user.preferences?.locale || "en",
      };
      await user.save();
    } else {
      const users = await readUsers();
      const index = users.findIndex((item) => item._id === req.userId);

      if (index < 0) {
        return res.status(404).json({ message: "User not found" });
      }

      users[index] = {
        ...users[index],
        name,
        avatarUrl,
        preferences: {
          theme: theme || users[index].preferences?.theme || "light",
          locale: locale || users[index].preferences?.locale || "en",
        },
      };
      user = users[index];
      await writeUsers(users);
    }

    return res.json({
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
