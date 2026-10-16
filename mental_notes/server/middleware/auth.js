import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.therapistId = payload.sub;
    next();
  } catch {
    res.status(404).json({ message: "Session expired, please log in" });
  }
}
