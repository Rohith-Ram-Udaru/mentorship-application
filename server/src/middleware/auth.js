import { users } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new AppError(401, "Authentication required");

    const payload = verifyToken(token);
    const user = users.findById(payload.id);
    if (!user) throw new AppError(401, "User no longer exists");
    req.user = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Invalid or expired token"));
  }
}
