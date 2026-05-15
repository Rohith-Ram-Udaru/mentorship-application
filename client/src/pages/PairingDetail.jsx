import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Activity, Eye, HeartPulse, Lock, Plus, Send, ShieldCheck, Target, Trash2, Users } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label, Select, Textarea } from "../components/ui/input";
import { Tabs } from "../components/ui/tabs";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageShell } from "../components/PageShell";
import { PrivacyIndicator } from "../components/PrivacyIndicator";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import { feedbackApi, kraApi, pairingsApi, sessionsApi } from "../services/mentorflow";

export function PairingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("sessions");
  const [error, setError] = useState("");
  const pairingLoad = useAsync(() => pairingsApi.get(id), [id]);
  const timelineLoad = useAsync(() => pairingsApi.timeline(id), [id]);
  const sessionLoad = useAsync(() => sessionsApi.list(id, { sort: "desc", page: 1, limit: 20 }), [id]);
  const feedbackLoad = useAsync(() => feedbackApi.list(id, { sort: "desc", page: 1, limit: 20 }), [id]);
  const kraLoad = useAsync(() => kraApi.list(id), [id]);

  const pairing = pairingLoad.data?.pairing;
  const participant = pairing?.viewerRole === "mentor" || pairing?.viewerRole === "mentee";
  const readOnly = !participant || pairing?.status === "Ended";
  const otherParticipant = pairing?.mentor?._id === user?.id ? pairing?.mentee : pairing?.mentor;

  const kpiTrend = useMemo(() => {
    const points = [];
    for (const kra of kraLoad.data?.items || []) {
      for (const kpi of kra.kpis || []) {
        for (const entry of kpi.history || []) {
          const numeric = Number.parseFloat(String(entry.newValue).replace(/[^\d.-]/g, ""));
          if (!Number.isNaN(numeric)) points.push({ date: new Date(entry.createdAt).toLocaleDateString(), value: numeric, name: kpi.title });
        }
      }
    }
    return points.slice(-12);
  }, [kraLoad.data]);

  async function refreshAll() {
    setError("");
    await Promise.all([pairingLoad.run(), timelineLoad.run(), sessionLoad.run(), feedbackLoad.run(), kraLoad.run()]);
  }

  async function guarded(action) {
    setError("");
    try {
      await action();
      await refreshAll();
      showToast({ type: "success", title: "Changes saved", message: "The mentorship record has been updated." });
    } catch (err) {
      const message = err.friendlyMessage || err.message;
      setError(message);
      showToast({ type: "error", title: "Action blocked", message });
    }
  }

  if (!pairing) return <div className="text-sm text-foreground/60">Loading pairing...</div>;

  return (
    <PageShell className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-black tracking-normal">{pairing.mentor?.name} {"->"} {pairing.mentee?.name}</h1>
            <Badge tone="blue">{pairing.viewerRole}</Badge>
            <Badge tone={pairing.status === "Active" ? "green" : pairing.status === "Paused" ? "amber" : "gray"}>{pairing.status}</Badge>
          </div>
          <p className="mt-2 text-foreground/60">{pairing.mentor?.email} / {pairing.mentee?.email}</p>
        </div>
        {participant && (
          <div className="flex flex-wrap gap-2">
            {pairing.status !== "Paused" && pairing.status !== "Ended" && (
              <Button variant="outline" onClick={() => guarded(() => pairingsApi.status(id, { status: "Paused" }))}>Pause</Button>
            )}
            {pairing.status === "Paused" && (
              <Button variant="outline" onClick={() => guarded(() => pairingsApi.status(id, { status: "Active" }))}>Resume</Button>
            )}
            {pairing.status !== "Ended" && (
              <Button variant="danger" onClick={() => guarded(() => pairingsApi.status(id, { status: "Ended" }))}>End</Button>
            )}
          </div>
        )}
      </div>

      {error && <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={HeartPulse} label="Mentorship progress" value={`${pairing.health?.score ?? 0}%`} />
        <MetricCard icon={Activity} label="Open next steps" value={pairing.health?.openActionItems ?? 0} accent="text-danger" />
        <MetricCard icon={Target} label="Goals at risk" value={pairing.health?.kpisAtRisk ?? 0} accent="text-amber-500" />
        <MetricCard icon={ShieldCheck} label="Privacy view" value={pairing.viewerRole === "observer" ? "Scoped" : "Full"} />
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { value: "sessions", label: "Mentorship Sessions" },
                { value: "feedback", label: "Feedback" },
                { value: "goals", label: "Goals & KPIs" },
                { value: "timeline", label: "Timeline" },
                { value: "observers", label: "Observers" }
              ]}
            />
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              {pairing.viewerRole === "observer" ? <Eye size={16} /> : <Lock size={16} />}
              {pairing.viewerRole === "observer" ? "Observer-safe view" : "Participant privacy controls active"}
            </div>
          </div>
        </CardContent>
      </Card>

      {tab === "sessions" && (
        <Sessions
          pairing={pairing}
          readOnly={readOnly}
          items={sessionLoad.data?.items || []}
          onCreate={(payload) => guarded(() => sessionsApi.create(id, payload))}
          onUpdate={(sessionId, payload) => guarded(() => sessionsApi.update(id, sessionId, payload))}
        />
      )}
      {tab === "feedback" && (
        <FeedbackPanel
          pairing={pairing}
          readOnly={readOnly}
          otherParticipant={otherParticipant}
          items={feedbackLoad.data?.items || []}
          onCreate={(payload) => guarded(() => feedbackApi.create(id, payload))}
          onDelete={(feedbackId) => guarded(() => feedbackApi.remove(id, feedbackId))}
          userId={user.id}
        />
      )}
      {tab === "goals" && (
        <Goals
          pairing={pairing}
          readOnly={readOnly}
          items={kraLoad.data?.items || []}
          trend={kpiTrend}
          onKra={(payload) => guarded(() => kraApi.create(id, payload))}
          onKpi={(kraId, payload) => guarded(() => kraApi.createKpi(id, kraId, payload))}
          onUpdate={(kraId, kpiId, payload) => guarded(() => kraApi.updateKpi(id, kraId, kpiId, payload))}
        />
      )}
      {tab === "timeline" && <Timeline items={timelineLoad.data?.items || []} />}
      {tab === "observers" && (
        <Observers pairing={pairing} readOnly={readOnly} onAdd={(payload) => guarded(() => pairingsApi.addObserver(id, payload))} onRemove={(userId) => guarded(() => pairingsApi.removeObserver(id, userId))} />
      )}
    </PageShell>
  );
}

function Sessions({ pairing, readOnly, items, onCreate, onUpdate }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), agenda: "", notes: "", visibility: "pair", action: "" });
  async function submit(event) {
    event.preventDefault();
    await onCreate({
      date: form.date,
      agenda: form.agenda,
      notes: form.notes,
      visibility: form.visibility,
      actionItems: form.action
        ? [{ description: form.action, owner: pairing.mentee._id, status: "Open" }]
        : []
    });
    setForm({ ...form, agenda: "", notes: "", action: "" });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ListCard title="Mentorship Sessions">
        {items.length === 0 ? <EmptyState title="No sessions visible" body="Pair-only mentorship sessions are hidden from observers in every list and detail view." /> : items.map((session) => (
          <div key={session._id} className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">{session.agenda}</h3>
              <div className="flex items-center gap-2">
                <PrivacyIndicator visibility={session.visibility} />
                {!readOnly && (
                  <Select
                    className="h-8 w-44"
                    value={session.visibility}
                    onChange={(e) => onUpdate(session._id, { visibility: e.target.value })}
                  >
                    <option value="pair">Pair only</option>
                    <option value="observers">Pair + Observers</option>
                  </Select>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-foreground/60">{new Date(session.date).toLocaleDateString()} / {session.notes}</p>
            <div className="mt-3 space-y-2">
              {session.actionItems?.map((item) => (
                <div key={item._id} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span>{item.description}</span>
                  {!readOnly ? (
                    <Select
                      className="h-8 w-36"
                      value={item.status}
                      onChange={(e) =>
                        onUpdate(session._id, {
                          actionItems: session.actionItems.map((existing) => ({
                            _id: existing._id,
                            description: existing.description,
                            owner: existing.owner?._id || existing.owner,
                            dueDate: existing.dueDate || undefined,
                            status: existing._id === item._id ? e.target.value : existing.status
                          }))
                        })
                      }
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Done</option>
                    </Select>
                  ) : (
                    <Badge>{item.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </ListCard>
      {!readOnly && (
        <FormCard title="Log mentorship session" onSubmit={submit}>
          <Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Label>Agenda</Label><Input value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} required />
          <Label>Session Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} required />
          <Label>Visibility</Label><Select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="pair">Pair only</option><option value="observers">Pair + Observers</option></Select>
          <Label>First next step</Label><Input placeholder="Draft a growth plan before the next session" value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} />
          <Button className="w-full"><Plus size={16} /> Save session</Button>
        </FormCard>
      )}
    </div>
  );
}

function FeedbackPanel({ readOnly, otherParticipant, items, onCreate, onDelete, userId }) {
  const [form, setForm] = useState({ body: "", visibility: "pair" });
  async function submit(event) {
    event.preventDefault();
    await onCreate({ ...form, to: otherParticipant._id });
    setForm({ ...form, body: "" });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ListCard title="Feedback">
        {items.length === 0 ? <EmptyState title="No feedback visible" body="Pair-only feedback is hidden from observers at the API layer." /> : items.map((entry) => (
          <div key={entry._id} className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{entry.from?.name} {"->"} {entry.to?.name}</h3>
              <div className="flex items-center gap-2">
                <PrivacyIndicator visibility={entry.visibility} />
                {entry.from?._id === userId && !readOnly && <Button variant="ghost" size="icon" onClick={() => onDelete(entry._id)}><Trash2 size={16} /></Button>}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground/70">{entry.body}</p>
          </div>
        ))}
      </ListCard>
      {!readOnly && (
        <FormCard title={`Feedback to ${otherParticipant?.name || "participant"}`} onSubmit={submit}>
          <Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          <Label>Visibility is locked after sending</Label><Select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="pair">Pair only</option><option value="observers">Pair + Observers</option></Select>
          <Button className="w-full"><Send size={16} /> Send feedback</Button>
        </FormCard>
      )}
    </div>
  );
}

function Goals({ readOnly, items, trend, onKra, onKpi, onUpdate }) {
  const [kraForm, setKraForm] = useState({ title: "", description: "" });
  const [kpiForm, setKpiForm] = useState({});
  async function submitKra(event) {
    event.preventDefault();
    await onKra(kraForm);
    setKraForm({ title: "", description: "" });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Goal progress trend</CardTitle></CardHeader>
          <CardContent className="h-64">
            {trend.length === 0 ? <EmptyState title="No numeric trend yet" body="Update numeric KPI values to reveal goal movement over time." /> : (
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} /></LineChart></ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <ListCard title="Goals and KPIs">
          {items.length === 0 ? <EmptyState title="No goals yet" body="Participants can define KRAs, add KPIs, and preserve every progress update." /> : items.map((kra) => (
            <div key={kra._id} className="rounded-lg border border-border bg-background p-4">
              <h3 className="font-bold">{kra.title}</h3>
              <p className="mt-1 text-sm text-foreground/60">{kra.description}</p>
              <div className="mt-4 space-y-3">
                {kra.kpis.map((kpi) => (
                  <div key={kpi._id} className="rounded-md bg-muted p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><div className="font-semibold">{kpi.title}</div><div className="text-xs text-foreground/55">Target {kpi.targetValue} / Current {kpi.currentValue}</div></div>
                      <Badge tone={kpi.status === "On track" ? "green" : kpi.status === "At risk" ? "amber" : "red"}>{kpi.status}</Badge>
                    </div>
                    {!readOnly && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                        <Input placeholder="New value" value={kpiForm[kpi._id]?.newValue || ""} onChange={(e) => setKpiForm({ ...kpiForm, [kpi._id]: { ...(kpiForm[kpi._id] || {}), newValue: e.target.value } })} />
                        <Select value={kpiForm[kpi._id]?.newStatus || kpi.status} onChange={(e) => setKpiForm({ ...kpiForm, [kpi._id]: { ...(kpiForm[kpi._id] || {}), newStatus: e.target.value } })}><option>On track</option><option>At risk</option><option>Off track</option></Select>
                        <Button variant="outline" onClick={() => onUpdate(kra._id, kpi._id, { newValue: kpiForm[kpi._id]?.newValue || kpi.currentValue, newStatus: kpiForm[kpi._id]?.newStatus || kpi.status })}>Update</Button>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-foreground/50">{kpi.history?.length || 0} progress history events preserved</div>
                  </div>
                ))}
              </div>
              {!readOnly && <InlineKpiForm kraId={kra._id} onKpi={onKpi} />}
            </div>
          ))}
        </ListCard>
      </div>
      {!readOnly && (
        <FormCard title="Create growth goal" onSubmit={submitKra}>
          <Label>Title</Label><Input value={kraForm.title} onChange={(e) => setKraForm({ ...kraForm, title: e.target.value })} required />
          <Label>Description</Label><Textarea value={kraForm.description} onChange={(e) => setKraForm({ ...kraForm, description: e.target.value })} />
          <Button className="w-full"><Target size={16} /> Add goal</Button>
        </FormCard>
      )}
    </div>
  );
}

function InlineKpiForm({ kraId, onKpi }) {
  const [form, setForm] = useState({ title: "", targetValue: "", currentValue: "", status: "On track" });
  return (
    <form className="mt-4 grid gap-2 md:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); await onKpi(kraId, form); setForm({ title: "", targetValue: "", currentValue: "", status: "On track" }); }}>
      <Input placeholder="KPI title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      <Input placeholder="Target" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} required />
      <Input placeholder="Current" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} required />
      <Button variant="outline">Add KPI</Button>
    </form>
  );
}

function Timeline({ items }) {
  return <ListCard title="Unified activity timeline">{items.length === 0 ? <EmptyState title="No visible activity" body="The timeline only shows records this viewer is entitled to see." /> : items.map((item) => <div key={`${item.type}-${item.id}`} className="rounded-lg border border-border bg-background p-4"><Badge tone="blue">{item.type}</Badge><h3 className="mt-2 font-bold">{item.title}</h3><p className="mt-1 text-sm text-foreground/60">{new Date(item.at).toLocaleString()} / {item.body}</p></div>)}</ListCard>;
}

function Observers({ pairing, readOnly, onAdd, onRemove }) {
  const [email, setEmail] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ListCard title="Observers">
        {pairing.observers?.length === 0 ? <EmptyState title="No observers" body="Add HR or manager observers with scoped read-only visibility." /> : pairing.observers.map((observer) => (
          <div key={observer.user._id} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div><div className="font-bold">{observer.user.name}</div><div className="text-sm text-foreground/55">{observer.user.email}</div></div>
            {!readOnly && <Button variant="ghost" size="icon" onClick={() => onRemove(observer.user._id)}><Trash2 size={16} /></Button>}
          </div>
        ))}
      </ListCard>
      {!readOnly && <FormCard title="Add observer" onSubmit={async (e) => { e.preventDefault(); await onAdd({ email }); setEmail(""); }}><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /><Button className="w-full"><Users size={16} /> Add observer</Button></FormCard>}
    </div>
  );
}

function ListCard({ title, children }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-3">{children}</CardContent></Card>;
}

function FormCard({ title, onSubmit, children }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><form onSubmit={onSubmit} className="space-y-3">{children}</form></CardContent></Card>;
}
