import { canSeeVisibility, roleFor } from "./accessService.js";
import { feedback, hydratePairing, kras, pairings, sessions } from "./sqlStore.js";

function daysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export async function buildHealth(pairing) {
  const sessionRows = sessions.list({ pairingId: pairing._id, role: "mentor", sort: -1, page: 1, limit: 500 }).items;
  const kraRows = kras.list(pairing._id);
  const lastSession = sessionRows[0];
  const openActionItems = sessionRows.reduce(
    (sum, session) => sum + session.actionItems.filter((item) => item.status !== "Done").length,
    0
  );
  const totalKpis = kraRows.flatMap((kra) => kra.kpis);
  const atRisk = totalKpis.filter((kpi) => kpi.status !== "On track").length;
  const recencyPenalty = lastSession ? Math.min(daysSince(lastSession.date) * 1.2, 35) : 35;
  const actionPenalty = Math.min(openActionItems * 4, 25);
  const riskPenalty = totalKpis.length ? (atRisk / totalKpis.length) * 30 : 10;
  const trustBonus = Math.min(feedback.count(pairing._id, true) * 2, 10);
  const score = Math.max(0, Math.min(100, Math.round(100 - recencyPenalty - actionPenalty - riskPenalty + trustBonus)));

  const alerts = [];
  if (!lastSession || daysSince(lastSession.date) > 21) alerts.push("No recent 1:1 session");
  if (openActionItems >= 3) alerts.push("Open action items are accumulating");
  if (atRisk > 0) alerts.push("One or more KPIs need attention");
  if (pairing.status === "Paused") alerts.push("Pairing is paused");

  return {
    score,
    lastSessionDate: lastSession?.date || null,
    openActionItems,
    kpisAtRisk: atRisk,
    totalKpis: totalKpis.length,
    alerts
  };
}

export async function buildTimeline(pairing, userId, limit = 40) {
  const role = roleFor(pairing, userId);
  const sessionRows = sessions.list({ pairingId: pairing._id, role, sort: -1, page: 1, limit }).items;
  const feedbackRows = feedback.list({ pairingId: pairing._id, role, sort: -1, page: 1, limit }).items;
  const kraRows = kras.list(pairing._id);

  const items = [
    ...sessionRows
      .filter((session) => canSeeVisibility(role, session.visibility))
      .map((session) => ({
        id: session._id,
        type: "session",
        at: session.date,
        title: session.agenda,
        body: session.notes,
        visibility: session.visibility,
        actor: session.createdBy
      })),
    ...feedbackRows
      .filter((entry) => canSeeVisibility(role, entry.visibility))
      .map((entry) => ({
        id: entry._id,
        type: "feedback",
        at: entry.createdAt,
        title: `Feedback from ${entry.from?.name || "participant"}`,
        body: entry.body,
        visibility: entry.visibility,
        actor: entry.from
      }))
  ];

  for (const kra of kraRows) {
    items.push({
      id: kra._id,
      type: "kra",
      at: kra.createdAt,
      title: kra.title,
      body: kra.description || "KRA created",
      visibility: "observers",
      actor: kra.createdBy
    });
    for (const kpi of kra.kpis) {
      for (const update of kpi.history || []) {
        items.push({
          id: update._id,
          type: "kpi",
          at: update.createdAt,
          title: `${kpi.title}: ${update.newStatus}`,
          body: `${update.previousValue} -> ${update.newValue}${update.note ? `: ${update.note}` : ""}`,
          visibility: "observers",
          actor: update.author
        });
      }
    }
  }

  return items.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, limit);
}

export async function organizationDashboard(userId) {
  const all = pairings.listAccessible(userId.toString(), { page: 1, limit: 1000 }).items.map(hydratePairing);
  const healthRows = await Promise.all(all.map((pairing) => buildHealth(pairing)));
  const byStatus = all.reduce((acc, pairing) => {
    acc[pairing.status] = (acc[pairing.status] || 0) + 1;
    return acc;
  }, {});

  return {
    totalPairings: all.length,
    byStatus,
    averageHealth: healthRows.length
      ? Math.round(healthRows.reduce((sum, row) => sum + row.score, 0) / healthRows.length)
      : 0,
    driftAlerts: healthRows.reduce((sum, row) => sum + row.alerts.length, 0),
    rows: all.map((pairing, index) => ({
      id: pairing._id,
      mentor: pairing.mentor,
      mentee: pairing.mentee,
      role: roleFor(pairing, userId),
      status: pairing.status,
      health: healthRows[index]
    }))
  };
}
