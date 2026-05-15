import { kras, makeId, now } from "../services/sqlStore.js";
import { AppError } from "../utils/AppError.js";
import { getPagination, pagePayload } from "../utils/pagination.js";

export async function listKras(req, res) {
  res.json({ items: kras.list(req.pairing._id) });
}

export async function createKra(req, res) {
  const kra = kras.create({
    pairingId: req.pairing._id,
    title: req.body.title,
    description: req.body.description,
    createdBy: req.user._id
  });
  res.status(201).json({ kra });
}

export async function createKpi(req, res) {
  const kra = kras.findForPairing(req.params.kraId, req.pairing._id);
  if (!kra) throw new AppError(404, "KRA not found");
  const kpis = stripKpiUsers(kra.kpis);
  const id = makeId();
  kpis.push({
    _id: id,
    id,
    title: req.body.title,
    targetValue: req.body.targetValue,
    currentValue: req.body.currentValue,
    status: req.body.status,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate).toISOString() : null,
    createdBy: req.user._id,
    createdAt: now(),
    updatedAt: now(),
    history: [
      {
        _id: makeId(),
        previousValue: "Created",
        newValue: req.body.currentValue,
        newStatus: req.body.status,
        note: "Initial KPI baseline",
        author: req.user._id,
        createdAt: now()
      }
    ]
  });
  res.status(201).json({ kra: kras.saveKpis(kra._id, kpis) });
}

export async function updateKpi(req, res) {
  const kra = kras.findForPairing(req.params.kraId, req.pairing._id);
  if (!kra) throw new AppError(404, "KRA not found");
  const kpis = stripKpiUsers(kra.kpis);
  const kpi = kpis.find((item) => item._id === req.params.kpiId || item.id === req.params.kpiId);
  if (!kpi) throw new AppError(404, "KPI not found");

  const previousValue = kpi.currentValue;
  kpi.currentValue = req.body.newValue;
  kpi.status = req.body.newStatus;
  kpi.updatedAt = now();
  kpi.history.push({
    _id: makeId(),
    previousValue,
    newValue: req.body.newValue,
    newStatus: req.body.newStatus,
    note: req.body.note,
    author: req.user._id,
    createdAt: now()
  });

  res.json({ kra: kras.saveKpis(kra._id, kpis) });
}

export async function listKpiHistory(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const kra = kras.findForPairing(req.params.kraId, req.pairing._id);
  if (!kra) throw new AppError(404, "KRA not found");
  const kpi = kra.kpis.find((item) => item._id === req.params.kpiId || item.id === req.params.kpiId);
  if (!kpi) throw new AppError(404, "KPI not found");
  const sorted = [...(kpi.history || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(pagePayload(sorted.slice(skip, skip + limit), sorted.length, page, limit));
}

function stripKpiUsers(kpis = []) {
  return kpis.map((kpi) => ({
    ...kpi,
    createdBy: kpi.createdBy?._id || kpi.createdBy,
    history: (kpi.history || []).map((entry) => ({ ...entry, author: entry.author?._id || entry.author }))
  }));
}
