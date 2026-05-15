import { Router } from "express";
import {
  addObserver,
  createPairing,
  getPairing,
  listPairings,
  orgDashboard,
  pairingSummary,
  pairingTimeline,
  removeObserver,
  updatePairingStatus
} from "../controllers/pairingController.js";
import { createFeedback, deleteFeedback, getFeedback, listFeedback } from "../controllers/feedbackController.js";
import { createKpi, createKra, listKpiHistory, listKras, updateKpi } from "../controllers/kraController.js";
import { createSession, getSession, listSessions, updateSession } from "../controllers/sessionController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireMutablePairing, requirePairingAccess, requirePairParticipant } from "../middleware/pairingAccess.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { feedbackSchemas, kraSchemas, pairingSchemas, sessionSchemas, validate } from "../validators/schemas.js";

export const pairingRoutes = Router();

pairingRoutes.use(requireAuth);
pairingRoutes.get("/", asyncHandler(listPairings));
pairingRoutes.post("/", validate(pairingSchemas.create), asyncHandler(createPairing));
pairingRoutes.get("/organization/dashboard", asyncHandler(orgDashboard));

pairingRoutes.use("/:pairingId", asyncHandler(requirePairingAccess));
pairingRoutes.get("/:pairingId", asyncHandler(getPairing));
pairingRoutes.patch(
  "/:pairingId/status",
  requirePairParticipant,
  validate(pairingSchemas.status),
  asyncHandler(updatePairingStatus)
);
pairingRoutes.post(
  "/:pairingId/observers",
  requirePairParticipant,
  requireMutablePairing,
  validate(pairingSchemas.observer),
  asyncHandler(addObserver)
);
pairingRoutes.delete(
  "/:pairingId/observers/:userId",
  requirePairParticipant,
  requireMutablePairing,
  asyncHandler(removeObserver)
);
pairingRoutes.get("/:pairingId/timeline", asyncHandler(pairingTimeline));
pairingRoutes.get("/:pairingId/summary", asyncHandler(pairingSummary));

pairingRoutes.get("/:pairingId/sessions", asyncHandler(listSessions));
pairingRoutes.post(
  "/:pairingId/sessions",
  requirePairParticipant,
  requireMutablePairing,
  validate(sessionSchemas.create),
  asyncHandler(createSession)
);
pairingRoutes.get("/:pairingId/sessions/:sessionId", asyncHandler(getSession));
pairingRoutes.patch(
  "/:pairingId/sessions/:sessionId",
  requirePairParticipant,
  requireMutablePairing,
  validate(sessionSchemas.update),
  asyncHandler(updateSession)
);

pairingRoutes.get("/:pairingId/feedback", asyncHandler(listFeedback));
pairingRoutes.post(
  "/:pairingId/feedback",
  requirePairParticipant,
  requireMutablePairing,
  validate(feedbackSchemas.create),
  asyncHandler(createFeedback)
);
pairingRoutes.get("/:pairingId/feedback/:feedbackId", asyncHandler(getFeedback));
pairingRoutes.delete(
  "/:pairingId/feedback/:feedbackId",
  requirePairParticipant,
  requireMutablePairing,
  asyncHandler(deleteFeedback)
);

pairingRoutes.get("/:pairingId/kras", asyncHandler(listKras));
pairingRoutes.post(
  "/:pairingId/kras",
  requirePairParticipant,
  requireMutablePairing,
  validate(kraSchemas.create),
  asyncHandler(createKra)
);
pairingRoutes.post(
  "/:pairingId/kras/:kraId/kpis",
  requirePairParticipant,
  requireMutablePairing,
  validate(kraSchemas.kpiCreate),
  asyncHandler(createKpi)
);
pairingRoutes.patch(
  "/:pairingId/kras/:kraId/kpis/:kpiId",
  requirePairParticipant,
  requireMutablePairing,
  validate(kraSchemas.kpiUpdate),
  asyncHandler(updateKpi)
);
pairingRoutes.get("/:pairingId/kras/:kraId/kpis/:kpiId/history", asyncHandler(listKpiHistory));
