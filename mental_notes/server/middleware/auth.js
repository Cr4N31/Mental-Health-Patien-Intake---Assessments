import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const token = bearer || req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session expired, please log in" });
  }

  try {
    const user = await User.findById(payload.sub).select("passwordChangedAt");

    // Account deleted
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    // Password was reset after this session was issued
    if (
      user.passwordChangedAt &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      return res
        .status(401)
        .json({ message: "Session expired, please log in" });
    }

    req.userId = payload.sub;
    next();
  } catch (err) {
    next(err);
  }
}
