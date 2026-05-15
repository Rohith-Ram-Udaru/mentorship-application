import { canSeeVisibility, participantIds } from "../services/accessService.js";
import { feedback } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { getPagination, pagePayload } from "../utils/pagination.js";

export async function listFeedback(req, res) {
  const { page, limit } = getPagination(req.query);
  const sort = req.query.sort === "asc" ? 1 : -1;
  const { items, total } = feedback.list({
    pairingId: req.pairing._id,
    role: req.pairingRole,
    direction: req.query.direction,
    userId: req.user._id,
    sort,
    page,
    limit
  });
  res.json(pagePayload(items, total, page, limit));
}

export async function createFeedback(req, res) {
  const allowedRecipients = participantIds(req.pairing).filter((id) => id !== req.user._id.toString());
  if (!allowedRecipients.includes(req.body.to)) {
    throw new AppError(400, "Feedback recipient must be the other participant");
  }

  const entry = feedback.create({
    pairingId: req.pairing._id,
    from: req.user._id,
    to: req.body.to,
    body: req.body.body,
    visibility: req.body.visibility
  });

  res.status(201).json({ feedback: entry });
}

export async function getFeedback(req, res) {
  const entry = feedback.findForPairing(req.params.feedbackId, req.pairing._id);
  if (!entry) throw new AppError(404, "Feedback not found");
  if (!canSeeVisibility(req.pairingRole, entry.visibility)) throw new AppError(404, "Feedback not found");
  res.json({ feedback: entry });
}

export async function deleteFeedback(req, res) {
  const entry = feedback.findForPairing(req.params.feedbackId, req.pairing._id);
  if (!entry) throw new AppError(404, "Feedback not found");
  if (entry.from._id !== req.user._id) throw new AppError(403, "Only the author can delete feedback");
  feedback.remove(entry._id);
  res.status(204).send();
}
