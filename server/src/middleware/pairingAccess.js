import { getPairingForUser, assertParticipant, assertNotEnded } from "../services/accessService.js";

export async function requirePairingAccess(req, _res, next) {
  try {
    const pairingId = req.params.pairingId || req.params.id;
    const { pairing, role } = await getPairingForUser(pairingId, req.user._id);
    req.pairing = pairing;
    req.pairingRole = role;
    next();
  } catch (error) {
    next(error);
  }
}

export function requirePairParticipant(req, _res, next) {
  try {
    assertParticipant(req.pairing, req.user._id);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireMutablePairing(req, _res, next) {
  try {
    assertNotEnded(req.pairing);
    next();
  } catch (error) {
    next(error);
  }
}
