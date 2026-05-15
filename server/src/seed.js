import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import { feedback, kras, pairings, sessions, users, makeId, now } from "./services/sqlStore.js";

await connectDb();

const passwordHash = await bcrypt.hash("Password123!", 12);
const demoUsers = [
  ["Mira Mentor", "mentor@mentorflow.test", "Principal Engineer", "Platform"],
  ["Nina Mentee", "mentee@mentorflow.test", "Product Manager", "Growth"],
  ["Omar Observer", "observer@mentorflow.test", "HR Partner", "People"],
  ["Cora Coach", "coach@mentorflow.test", "Engineering Manager", "Apps"]
].map(([name, email, title, department]) => users.upsert({ name, email, title, department, passwordHash }));

const [mentor, mentee, observer, coach] = demoUsers;

kras.deleteAll();
feedback.deleteAll();
sessions.deleteAll();
pairings.deleteAll();

const pairing = pairings.create({
  mentorId: mentor._id,
  menteeId: mentee._id,
  startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
  createdBy: coach._id
});

pairings.saveObservers(pairing._id, [{ user: observer._id, addedBy: mentor._id, addedAt: now() }]);

sessions.create({
  pairingId: pairing._id,
  date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  agenda: "Clarify growth narrative for Q2",
  notes: "Discussed stakeholder mapping, strategic writing, and demo readiness.",
  visibility: "observers",
  createdBy: mentor._id,
  actionItems: [
    { description: "Draft promotion packet themes", owner: mentee._id, dueDate: new Date(Date.now() + 604800000), status: "Open" },
    { description: "Review stakeholder map", owner: mentor._id, status: "In Progress" }
  ]
});

sessions.create({
  pairingId: pairing._id,
  date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  agenda: "Private confidence check-in",
  notes: "Pair-only discussion about psychological safety and feedback style.",
  visibility: "pair",
  createdBy: mentee._id,
  actionItems: []
});

feedback.create({
  pairingId: pairing._id,
  from: mentor._id,
  to: mentee._id,
  body: "Your written strategy is getting sharper. Next step: make the risk register more explicit.",
  visibility: "observers"
});

feedback.create({
  pairingId: pairing._id,
  from: mentee._id,
  to: mentor._id,
  body: "The last session helped me name the exact gap. I would like more examples next time.",
  visibility: "pair"
});

const kra = kras.create({
  pairingId: pairing._id,
  title: "Build strategic product leadership",
  description: "Turn ambiguous work into aligned roadmaps and crisp executive updates.",
  createdBy: mentor._id
});

kras.saveKpis(kra._id, [
  {
    _id: makeId(),
    id: makeId(),
    title: "Executive update quality",
    targetValue: "4.5/5",
    currentValue: "3.8/5",
    status: "At risk",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
    createdBy: mentor._id,
    createdAt: now(),
    updatedAt: now(),
    history: [
      {
        _id: makeId(),
        previousValue: "Created",
        newValue: "3.2/5",
        newStatus: "At risk",
        note: "Baseline from first review",
        author: mentor._id,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
      },
      {
        _id: makeId(),
        previousValue: "3.2/5",
        newValue: "3.8/5",
        newStatus: "At risk",
        note: "Improved narrative, still needs tighter metrics",
        author: mentor._id,
        createdAt: now()
      }
    ]
  },
  {
    _id: makeId(),
    id: makeId(),
    title: "Stakeholder readiness",
    targetValue: "8 stakeholders",
    currentValue: "6 stakeholders",
    status: "On track",
    createdBy: mentee._id,
    createdAt: now(),
    updatedAt: now(),
    history: [
      {
        _id: makeId(),
        previousValue: "Created",
        newValue: "6 stakeholders",
        newStatus: "On track",
        note: "Initial map is credible",
        author: mentee._id,
        createdAt: now()
      }
    ]
  }
]);

console.log("SQLite seed complete. Password for all demo users: Password123!");
process.exit(0);
