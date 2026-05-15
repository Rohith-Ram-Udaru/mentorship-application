import crypto from "node:crypto";
import { getDb } from "../config/db.js";

export const makeId = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export function publicUser(user) {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.title,
    department: user.department
  };
}

export const users = {
  create({ name, email, passwordHash, title, department }) {
    const id = makeId();
    const stamp = now();
    getDb()
      .prepare(
        "INSERT INTO users (id, name, email, password_hash, title, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, name, email, passwordHash, title || "Team Member", department || "People", stamp, stamp);
    return this.findById(id);
  },
  upsert({ name, email, passwordHash, title, department }) {
    const existing = this.findByEmail(email);
    if (existing) {
      const stamp = now();
      getDb()
        .prepare("UPDATE users SET name = ?, password_hash = ?, title = ?, department = ?, updated_at = ? WHERE email = ?")
        .run(name, passwordHash, title || "Team Member", department || "People", stamp, email);
      return this.findByEmail(email);
    }
    return this.create({ name, email, passwordHash, title, department });
  },
  findByEmail(email) {
    const row = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email);
    return rowToUser(row);
  },
  findById(id) {
    const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
    return rowToUser(row);
  },
  search(q) {
    const like = `%${q}%`;
    return getDb()
      .prepare("SELECT * FROM users WHERE email LIKE ? OR name LIKE ? ORDER BY name LIMIT 10")
      .all(like, like)
      .map(rowToUser)
      .map(publicUser);
  }
};

export const pairings = {
  create({ mentorId, menteeId, startDate, endDate, createdBy }) {
    const id = makeId();
    const stamp = now();
    getDb()
      .prepare(
        "INSERT INTO pairings (id, mentor_id, mentee_id, observers, start_date, end_date, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)"
      )
      .run(id, mentorId, menteeId, "[]", new Date(startDate).toISOString(), endDate ? new Date(endDate).toISOString() : null, createdBy, stamp, stamp);
    return this.findById(id);
  },
  findById(id) {
    return rowToPairing(getDb().prepare("SELECT * FROM pairings WHERE id = ?").get(id));
  },
  findDuplicate(mentorId, menteeId) {
    return rowToPairing(
      getDb()
        .prepare("SELECT * FROM pairings WHERE mentor_id = ? AND mentee_id = ? AND status != 'Ended' LIMIT 1")
        .get(mentorId, menteeId)
    );
  },
  listAccessible(userId, { status, role, page, limit }) {
    let all = getDb().prepare("SELECT * FROM pairings ORDER BY updated_at DESC").all().map(rowToPairing);
    all = all.filter((pairing) => roleForRaw(pairing, userId));
    if (status) all = all.filter((pairing) => pairing.status === status);
    if (role) all = all.filter((pairing) => roleForRaw(pairing, userId) === role);
    const total = all.length;
    return { items: all.slice((page - 1) * limit, page * limit), total };
  },
  updateStatus(id, { status, endDate }) {
    const stamp = now();
    getDb().prepare("UPDATE pairings SET status = ?, end_date = ?, updated_at = ? WHERE id = ?").run(status, endDate || null, stamp, id);
    return this.findById(id);
  },
  saveObservers(id, observers) {
    getDb().prepare("UPDATE pairings SET observers = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(observers), now(), id);
    return this.findById(id);
  },
  deleteAll() {
    getDb().prepare("DELETE FROM pairings").run();
  }
};

export const sessions = {
  create({ pairingId, date, agenda, notes, actionItems, visibility, createdBy }) {
    const id = makeId();
    const stamp = now();
    const normalized = normalizeActionItems(actionItems);
    getDb()
      .prepare(
        "INSERT INTO sessions (id, pairing_id, date, agenda, notes, action_items, visibility, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .run(id, pairingId, new Date(date).toISOString(), agenda, notes, JSON.stringify(normalized), visibility, createdBy, stamp, stamp);
    return this.findById(id);
  },
  findById(id) {
    return rowToSession(getDb().prepare("SELECT * FROM sessions WHERE id = ?").get(id));
  },
  findForPairing(id, pairingId) {
    return rowToSession(getDb().prepare("SELECT * FROM sessions WHERE id = ? AND pairing_id = ?").get(id, pairingId));
  },
  list({ pairingId, role, openActionItems, sort, page, limit }) {
    let rows = getDb().prepare("SELECT * FROM sessions WHERE pairing_id = ?").all(pairingId).map(rowToSession);
    if (role === "observer") rows = rows.filter((session) => session.visibility === "observers");
    if (openActionItems) {
      rows = rows.filter((session) => session.actionItems.some((item) => item.status === "Open" || item.status === "In Progress"));
    }
    rows.sort((a, b) => (sort === 1 ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date)));
    const total = rows.length;
    return { items: rows.slice((page - 1) * limit, page * limit), total };
  },
  update(id, payload, userId) {
    const existing = this.findById(id);
    if (!existing) return null;
    const next = {
      date: payload.date ? new Date(payload.date).toISOString() : existing.date,
      agenda: payload.agenda ?? existing.agenda,
      notes: payload.notes ?? existing.notes,
      visibility: payload.visibility ?? existing.visibility,
      actionItems: payload.actionItems ? normalizeActionItems(payload.actionItems) : stripUsersFromActionItems(existing.actionItems)
    };
    getDb()
      .prepare("UPDATE sessions SET date = ?, agenda = ?, notes = ?, visibility = ?, action_items = ?, updated_by = ?, updated_at = ? WHERE id = ?")
      .run(next.date, next.agenda, next.notes, next.visibility, JSON.stringify(next.actionItems), userId, now(), id);
    return this.findById(id);
  },
  count(pairingId) {
    return getDb().prepare("SELECT COUNT(*) AS count FROM sessions WHERE pairing_id = ?").get(pairingId).count;
  },
  deleteAll() {
    getDb().prepare("DELETE FROM sessions").run();
  }
};

export const feedback = {
  create({ pairingId, from, to, body, visibility }) {
    const id = makeId();
    const stamp = now();
    getDb()
      .prepare("INSERT INTO feedback (id, pairing_id, from_id, to_id, body, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, pairingId, from, to, body, visibility, stamp, stamp);
    return this.findById(id);
  },
  findById(id) {
    return rowToFeedback(getDb().prepare("SELECT * FROM feedback WHERE id = ?").get(id));
  },
  findForPairing(id, pairingId) {
    return rowToFeedback(getDb().prepare("SELECT * FROM feedback WHERE id = ? AND pairing_id = ?").get(id, pairingId));
  },
  list({ pairingId, role, direction, userId, sort, page, limit }) {
    let rows = getDb().prepare("SELECT * FROM feedback WHERE pairing_id = ?").all(pairingId).map(rowToFeedback);
    if (role === "observer") rows = rows.filter((entry) => entry.visibility === "observers");
    if (direction === "sent") rows = rows.filter((entry) => entry.from._id === userId);
    if (direction === "received") rows = rows.filter((entry) => entry.to._id === userId);
    rows.sort((a, b) => (sort === 1 ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt)));
    const total = rows.length;
    return { items: rows.slice((page - 1) * limit, page * limit), total };
  },
  remove(id) {
    getDb().prepare("DELETE FROM feedback WHERE id = ?").run(id);
  },
  count(pairingId, visibleOnly = false) {
    const sql = visibleOnly
      ? "SELECT COUNT(*) AS count FROM feedback WHERE pairing_id = ? AND visibility = 'observers'"
      : "SELECT COUNT(*) AS count FROM feedback WHERE pairing_id = ?";
    return getDb().prepare(sql).get(pairingId).count;
  },
  deleteAll() {
    getDb().prepare("DELETE FROM feedback").run();
  }
};

export const kras = {
  create({ pairingId, title, description, createdBy }) {
    const id = makeId();
    const stamp = now();
    getDb()
      .prepare("INSERT INTO kras (id, pairing_id, title, description, created_by, kpis, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(id, pairingId, title, description || "", createdBy, "[]", stamp, stamp);
    return this.findById(id);
  },
  findById(id) {
    return rowToKra(getDb().prepare("SELECT * FROM kras WHERE id = ?").get(id));
  },
  findForPairing(id, pairingId) {
    return rowToKra(getDb().prepare("SELECT * FROM kras WHERE id = ? AND pairing_id = ?").get(id, pairingId));
  },
  list(pairingId) {
    return getDb().prepare("SELECT * FROM kras WHERE pairing_id = ? ORDER BY created_at DESC").all(pairingId).map(rowToKra);
  },
  saveKpis(id, kpis) {
    getDb().prepare("UPDATE kras SET kpis = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(kpis), now(), id);
    return this.findById(id);
  },
  deleteAll() {
    getDb().prepare("DELETE FROM kras").run();
  }
};

export function hydratePairing(pairing) {
  if (!pairing) return null;
  const mentor = users.findById(pairing.mentor);
  const mentee = users.findById(pairing.mentee);
  const createdBy = users.findById(pairing.createdBy);
  return {
    ...pairing,
    mentor: publicUser(mentor),
    mentee: publicUser(mentee),
    createdBy: publicUser(createdBy),
    observers: pairing.observers.map((entry) => ({
      ...entry,
      user: publicUser(users.findById(entry.user)),
      addedBy: publicUser(users.findById(entry.addedBy))
    }))
  };
}

export function roleForRaw(pairing, userId) {
  if (pairing.mentor === userId || pairing.mentor?._id === userId) return "mentor";
  if (pairing.mentee === userId || pairing.mentee?._id === userId) return "mentee";
  if (pairing.observers?.some((observer) => (observer.user?._id || observer.user) === userId)) return "observer";
  return null;
}

function rowToUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    title: row.title,
    department: row.department,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToPairing(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    mentor: row.mentor_id,
    mentee: row.mentee_id,
    observers: parseJson(row.observers, []),
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToSession(row) {
  if (!row) return null;
  const actionItems = parseJson(row.action_items, []).map((item) => ({
    ...item,
    owner: publicUser(users.findById(item.owner))
  }));
  return {
    _id: row.id,
    id: row.id,
    pairing: row.pairing_id,
    date: row.date,
    agenda: row.agenda,
    notes: row.notes,
    actionItems,
    visibility: row.visibility,
    createdBy: publicUser(users.findById(row.created_by)),
    updatedBy: publicUser(users.findById(row.updated_by)),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToFeedback(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    pairing: row.pairing_id,
    from: publicUser(users.findById(row.from_id)),
    to: publicUser(users.findById(row.to_id)),
    body: row.body,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToKra(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    pairing: row.pairing_id,
    title: row.title,
    description: row.description,
    createdBy: publicUser(users.findById(row.created_by)),
    kpis: parseJson(row.kpis, []).map((kpi) => ({
      ...kpi,
      createdBy: publicUser(users.findById(kpi.createdBy)),
      history: (kpi.history || []).map((entry) => ({ ...entry, author: publicUser(users.findById(entry.author)) }))
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeActionItems(items = []) {
  return items.map((item) => ({
    _id: item._id || makeId(),
    description: item.description,
    owner: item.owner?._id || item.owner,
    dueDate: item.dueDate ? new Date(item.dueDate).toISOString() : null,
    status: item.status || "Open",
    createdAt: item.createdAt || now(),
    updatedAt: now()
  }));
}

function stripUsersFromActionItems(items = []) {
  return items.map((item) => ({
    ...item,
    owner: item.owner?._id || item.owner
  }));
}
