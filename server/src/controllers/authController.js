import bcrypt from "bcryptjs";
import { users, publicUser } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/token.js";

export async function register(req, res) {
  const existing = users.findByEmail(req.body.email);
  if (existing) throw new AppError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = users.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash,
    title: req.body.title,
    department: req.body.department
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

export async function login(req, res) {
  const user = users.findByEmail(req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }

  res.json({ token: signToken(user), user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function searchUsers(req, res) {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ items: [] });
  res.json({ items: users.search(q) });
}
