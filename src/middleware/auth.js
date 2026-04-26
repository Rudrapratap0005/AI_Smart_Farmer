import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "ai-smart-farming-dev-secret";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, secret);
    req.userId = payload.id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
