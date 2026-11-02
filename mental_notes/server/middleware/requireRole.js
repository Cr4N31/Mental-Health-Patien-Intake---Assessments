import User from "../models/User.js";

// Use after requireAuth. Reads the role from the database on every call,
// so removing someone's role takes effect immediately.
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId).select("role");
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Not allowed" });
      }
      req.userRole = user.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}
