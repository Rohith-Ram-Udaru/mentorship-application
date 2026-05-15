import { AppError } from "../utils/AppError.js";
import { hydratePairing, pairings, roleForRaw } from "./sqlStore.js";

const sameId = (a, b) => (a?._id || a)?.toString() === (b?._id || b)?.toString();

export function roleFor(pairing, userId) {
  return roleForRaw(pairing, userId.toString());
}

export function isParticipant(pairing, userId) {
  const role = roleFor(pairing, userId);
  return role === "mentor" || role === "mentee";
}

export function canSeeVisibility(role, visibility) {
  if (role === "mentor" || role === "mentee") return true;
  return role === "observer" && visibility === "observers";
}

export async function getPairingForUser(pairingId, userId) {
  const pairing = hydratePairing(pairings.findById(pairingId));
  if (!pairing) throw new AppError(404, "Pairing not found");
  const role = roleFor(pairing, userId);
  if (!role) throw new AppError(403, "You do not have access to this pairing");
  return { pairing, role };
}

export function assertParticipant(pairing, userId) {
  if (!isParticipant(pairing, userId)) {
    throw new AppError(403, "Only mentor or mentee can perform this action");
  }
}

export function assertNotEnded(pairing) {
  if (pairing.status === "Ended") {
    throw new AppError(409, "Ended pairings are read-only");
  }
}

export function assertActionItemOwners(pairing, actionItems = []) {
  for (const item of actionItems) {
    const owner = item.owner?.toString();
    if (!sameId(owner, pairing.mentor) && !sameId(owner, pairing.mentee)) {
      throw new AppError(400, "Action item owner must be the mentor or mentee");
    }
    if (item.dueDate && Number.isNaN(Date.parse(item.dueDate))) {
      throw new AppError(400, "Action item due date is invalid");
    }
  }
}

export function participantIds(pairing) {
  return [(pairing.mentor?._id || pairing.mentor).toString(), (pairing.mentee?._id || pairing.mentee).toString()];
}
