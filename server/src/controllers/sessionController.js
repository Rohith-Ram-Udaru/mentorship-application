import { assertActionItemOwners, canSeeVisibility } from "../services/accessService.js";
import { sessions } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { getPagination, pagePayload } from "../utils/pagination.js";

export async function listSessions(req, res) {
  const { page, limit } = getPagination(req.query);
  const sort = req.query.sort === "asc" ? 1 : -1;
  const { items, total } = sessions.list({
    pairingId: req.pairing._id,
    role: req.pairingRole,
    openActionItems: req.query.openActionItems === "true",
    sort,
    page,
    limit
  });
  res.json(pagePayload(items, total, page, limit));
}

export async function createSession(req, res) {
  assertActionItemOwners(req.pairing, req.body.actionItems);
  const session = sessions.create({
    ...req.body,
    pairingId: req.pairing._id,
    createdBy: req.user._id
  });
  res.status(201).json({ session });
}

export async function getSession(req, res) {
  const session = sessions.findForPairing(req.params.sessionId, req.pairing._id);
  if (!session) throw new AppError(404, "Session not found");
  if (!canSeeVisibility(req.pairingRole, session.visibility)) throw new AppError(404, "Session not found");
  res.json({ session });
}

export async function updateSession(req, res) {
  const existing = sessions.findForPairing(req.params.sessionId, req.pairing._id);
  if (!existing) throw new AppError(404, "Session not found");
  if (req.body.actionItems) assertActionItemOwners(req.pairing, req.body.actionItems);
  const session = sessions.update(req.params.sessionId, req.body, req.user._id);
  res.json({ session });
}
