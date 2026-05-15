import { buildHealth, buildTimeline, organizationDashboard } from "../services/analyticsService.js";
import { participantIds, roleFor } from "../services/accessService.js";
import { feedback, hydratePairing, kras, pairings, sessions, users } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { getPagination, pagePayload } from "../utils/pagination.js";

const isSame = (a, b) => (a?._id || a)?.toString() === (b?._id || b)?.toString();

export async function createPairing(req, res) {
  const mentor = users.findByEmail(req.body.mentorEmail);
  const mentee = users.findByEmail(req.body.menteeEmail);

  if (!mentor) throw new AppError(404, "Mentor email does not match a registered user");
  if (!mentee) throw new AppError(404, "Mentee email does not match a registered user");
  if (isSame(mentor, mentee)) throw new AppError(400, "Mentor and mentee must be different people");

  const endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
  if (endDate && endDate < new Date(req.body.startDate)) throw new AppError(400, "End date cannot be before start date");

  if (pairings.findDuplicate(mentor._id, mentee._id)) {
    throw new AppError(409, "An active or paused pairing already exists for these users");
  }

  const pairing = pairings.create({
    mentorId: mentor._id,
    menteeId: mentee._id,
    startDate: req.body.startDate,
    endDate,
    createdBy: req.user._id
  });

  res.status(201).json({ pairing: await serializePairing(pairing, req.user._id) });
}

export async function listPairings(req, res) {
  const { page, limit } = getPagination(req.query);
  const { items, total } = pairings.listAccessible(req.user._id, {
    status: req.query.status,
    role: req.query.role,
    page,
    limit
  });

  const payload = await Promise.all(items.map((pairing) => serializePairing(pairing, req.user._id)));
  res.json(pagePayload(payload, total, page, limit));
}

export async function getPairing(req, res) {
  res.json({ pairing: { ...req.pairing, viewerRole: req.pairingRole, health: await buildHealth(req.pairing) } });
}

export async function updatePairingStatus(req, res) {
  const nextStatus = req.body.status;
  if (req.pairing.status === "Ended") throw new AppError(409, "Ended pairings are read-only");
  const requestedEndDate = req.body.endDate ? new Date(req.body.endDate) : null;
  if (requestedEndDate && requestedEndDate < new Date(req.pairing.startDate)) {
    throw new AppError(400, "End date cannot be before start date");
  }
  const endDate = nextStatus === "Ended" ? requestedEndDate || new Date() : requestedEndDate;
  const updated = pairings.updateStatus(req.pairing._id, {
    status: nextStatus,
    endDate: endDate ? endDate.toISOString() : null
  });
  res.json({ pairing: await serializePairing(updated, req.user._id) });
}

export async function addObserver(req, res) {
  const observer = users.findByEmail(req.body.email);
  if (!observer) throw new AppError(404, "Observer email does not match a registered user");
  if (participantIds(req.pairing).includes(observer._id.toString())) {
    throw new AppError(400, "Mentor or mentee cannot be added as observer");
  }
  if (req.pairing.observers.some((entry) => isSame(entry.user, observer))) {
    throw new AppError(409, "Observer is already attached to this pairing");
  }

  const raw = pairings.findById(req.pairing._id);
  raw.observers.push({ user: observer._id, addedBy: req.user._id, addedAt: new Date().toISOString() });
  const updated = pairings.saveObservers(req.pairing._id, raw.observers);
  res.status(201).json({ pairing: await serializePairing(updated, req.user._id) });
}

export async function removeObserver(req, res) {
  const raw = pairings.findById(req.pairing._id);
  const before = raw.observers.length;
  raw.observers = raw.observers.filter((entry) => entry.user !== req.params.userId);
  if (raw.observers.length === before) throw new AppError(404, "Observer not found on this pairing");
  const updated = pairings.saveObservers(req.pairing._id, raw.observers);
  res.json({ pairing: await serializePairing(updated, req.user._id) });
}

export async function pairingTimeline(req, res) {
  res.json({ items: await buildTimeline(req.pairing, req.user._id) });
}

export async function pairingSummary(req, res) {
  const kraRows = kras.list(req.pairing._id);
  res.json({
    summary: {
      sessions: sessions.count(req.pairing._id),
      feedback: feedback.count(req.pairing._id),
      kras: kraRows.length,
      kpis: kraRows.reduce((sum, kra) => sum + kra.kpis.length, 0),
      health: await buildHealth(req.pairing)
    }
  });
}

export async function orgDashboard(req, res) {
  res.json({ dashboard: await organizationDashboard(req.user._id) });
}

async function serializePairing(pairing, userId) {
  const hydrated = hydratePairing(pairing);
  return { ...hydrated, viewerRole: roleFor(hydrated, userId), health: await buildHealth(hydrated) };
}
