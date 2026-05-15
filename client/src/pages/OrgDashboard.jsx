import { AlertTriangle, BarChart3, HeartPulse, Network } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { MetricCard } from "../components/MetricCard";
import { PageShell } from "../components/PageShell";
import { useAsync } from "../hooks/useAsync";
import { pairingsApi } from "../services/mentorflow";

export function OrgDashboard() {
  const { data, loading } = useAsync(() => pairingsApi.org(), []);
  const dashboard = data?.dashboard;
  const chartData = dashboard
    ? Object.entries(dashboard.byStatus).map(([status, count]) => ({ status, count }))
    : [];

  if (loading) return <div className="text-sm text-foreground/60">Loading analytics...</div>;

  return (
    <PageShell className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-normal">Organizational dashboard</h1>
        <p className="mt-2 text-foreground/60">Program analytics are scoped to pairings you are entitled to see.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Network} label="Pairings" value={dashboard.totalPairings} />
        <MetricCard icon={HeartPulse} label="Average progress" value={`${dashboard.averageHealth}%`} accent="text-accent" />
        <MetricCard icon={AlertTriangle} label="Goal Risk Alerts" value={dashboard.driftAlerts} accent="text-danger" />
        <MetricCard icon={BarChart3} label="Status groups" value={chartData.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Status distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Progress and goal risk</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {dashboard.rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{row.mentor?.name} {"->"} {row.mentee?.name}</div>
                    <div className="mt-1 flex gap-2"><Badge>{row.role}</Badge><Badge>{row.status}</Badge></div>
                  </div>
                  <div className="text-2xl font-black text-primary">{row.health.score}%</div>
                </div>
                {row.health.alerts.length > 0 && (
                  <div className="mt-3 text-sm text-danger">{row.health.alerts.join(" / ")}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
