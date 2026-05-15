import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, Filter, Handshake, HeartPulse, Plus } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label, Select } from "../components/ui/input";
import { EmptyState } from "../components/EmptyState";
import { MetricCard } from "../components/MetricCard";
import { PageShell } from "../components/PageShell";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import { pairingsApi } from "../services/mentorflow";

export function Dashboard() {
  const [filters, setFilters] = useState({ status: "", role: "" });
  const [form, setForm] = useState({
    mentorEmail: "",
    menteeEmail: "",
    startDate: new Date().toISOString().slice(0, 10)
  });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const { showToast } = useToast();
  const { data, loading, run } = useAsync(() => pairingsApi.list({ ...filters, page: 1, limit: 20 }), [filters.status, filters.role]);
  const pairings = data?.items || [];
  const metrics = useMemo(() => {
    const avg = pairings.length ? Math.round(pairings.reduce((sum, item) => sum + (item.health?.score || 0), 0) / pairings.length) : 0;
    return { total: data?.total || 0, active: pairings.filter((p) => p.status === "Active").length, avg };
  }, [pairings, data]);

  async function createPairing(event) {
    event.preventDefault();
    setError("");
    setCreating(true);
    try {
      await pairingsApi.create(form);
      setForm({ mentorEmail: "", menteeEmail: "", startDate: new Date().toISOString().slice(0, 10) });
      showToast({ type: "success", title: "Pairing created", message: "The mentorship relationship is now ready to operate." });
      run();
    } catch (err) {
      const message = err.friendlyMessage || err.message;
      setError(message);
      showToast({ type: "error", title: "Could not create pairing", message });
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageShell className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-normal">Mentorship command center</h1>
          <p className="mt-2 text-foreground/60">Structured relationships, trusted privacy, and measurable growth in one workspace.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Handshake} label="Accessible pairings" value={metrics.total} />
        <MetricCard icon={Activity} label="Active relationships" value={metrics.active} accent="text-accent" />
        <MetricCard icon={HeartPulse} label="Average progress" value={`${metrics.avg}%`} accent="text-danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Your pairings</CardTitle>
            <div className="flex gap-2">
              <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All statuses</option>
                <option>Active</option>
                <option>Paused</option>
                <option>Ended</option>
              </Select>
              <Select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                <option value="">All roles</option>
                <option value="mentor">Mentor</option>
                <option value="mentee">Mentee</option>
                <option value="observer">Observer</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-foreground/60">Loading pairings...</div>
            ) : pairings.length === 0 ? (
              <EmptyState title="No pairings yet" body="Create a pairing by entering two registered user emails." />
            ) : (
              <div className="space-y-3">
                {pairings.map((pairing) => (
                  <Link
                    key={pairing._id}
                    to={`/app/pairings/${pairing._id}`}
                    className="block rounded-lg border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-glow"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{pairing.mentor?.name} {"->"} {pairing.mentee?.name}</h3>
                          <Badge tone={pairing.status === "Active" ? "green" : pairing.status === "Paused" ? "amber" : "gray"}>{pairing.status}</Badge>
                          <Badge tone="blue">{pairing.viewerRole}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground/55">
                          {pairing.mentor?.email} / {pairing.mentee?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">{pairing.health?.score ?? 0}%</div>
                        <div className="text-xs font-semibold text-foreground/50">Progress score</div>
                      </div>
                      <ArrowRight className="hidden text-foreground/30 md:block" size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus size={18} /> Create mentorship pairing</CardTitle>
            <p className="mt-2 text-sm text-foreground/58">Use registered emails for the mentor and mentee. Pairings cannot duplicate active relationships.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPairing} className="space-y-4">
              <div>
                <Label>Mentor email</Label>
                <Input placeholder="mentor@company.com" type="email" value={form.mentorEmail} onChange={(e) => setForm({ ...form, mentorEmail: e.target.value })} required />
              </div>
              <div>
                <Label>Mentee email</Label>
                <Input placeholder="mentee@company.com" type="email" value={form.menteeEmail} onChange={(e) => setForm({ ...form, menteeEmail: e.target.value })} required />
              </div>
              <div>
                <Label>Start date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              {error && <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
              <Button className="w-full" disabled={creating}><Filter size={16} /> {creating ? "Creating pairing..." : "Create Governed Pairing"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
