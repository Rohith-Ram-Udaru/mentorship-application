import { motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Eye, Lock, Network, ShieldCheck, Sparkles, Target, TrendingUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { BRAND } from "../utils/brand";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 }
};

export function Landing() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function exploreDemo() {
    try {
      await login({ email: "mentor@mentorflow.test", password: "Password123!" });
      showToast({ type: "success", title: "Demo opened", message: "You are viewing MentorPulse as a mentor." });
      navigate("/app");
    } catch (err) {
      showToast({
        type: "error",
        title: "Demo unavailable",
        message: err.friendlyMessage || "Run the seed script, then try Explore Demo again."
      });
    }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <BrandMark />
          <div className="flex items-center gap-2">
            <button onClick={exploreDemo} className="hidden rounded-md px-3 py-2 text-sm font-semibold text-foreground/62 transition hover:bg-muted hover:text-primary sm:inline-flex">
              Explore Demo
            </button>
            <Link to="/login"><Button variant="outline">Sign In</Button></Link>
            <Link to="/register"><Button className="hidden sm:inline-flex">Create Your Mentorship Workspace</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 lg:grid-cols-[1fr_0.9fr]">
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.6 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-semibold text-foreground/70 shadow-sm">
            <Sparkles size={15} className="text-accent" /> {BRAND.tagline}
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            Turn mentorship conversations into measurable progress.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground/68">
            MentorPulse brings structure, trust, and continuity to every mentor relationship.
            Private conversations stay private while growth becomes visible, trackable, and actionable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button size="lg">Create Your Mentorship Workspace <ArrowRight size={18} /></Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
            <Button size="lg" variant="ghost" onClick={exploreDemo}>Explore Demo</Button>
          </div>
          <div className="mt-8 grid max-w-2xl gap-3 text-sm text-foreground/64 sm:grid-cols-3">
            {["Pair-only privacy", "Observer governance", "Goal progress history"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12, duration: 0.55 }}>
          <div className="glass relative overflow-hidden rounded-xl border border-border p-4 shadow-glow">
            <div className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Leadership Mentorship Program</div>
                <div className="text-xs text-foreground/50">Progress overview</div>
              </div>
              <div className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">Protected</div>
            </div>
            <div className="grid gap-3">
              {[
                [TrendingUp, "Mentorship Progress Score", "82%", "Signals from cadence, next steps, and goal confidence"],
                [ShieldCheck, "Privacy Protection", "0 leaks", "Pair-only records never appear in observer views"],
                [Target, "Goal Risk Alerts", "3", "Trajectory changes become visible before timelines slip"]
              ].map(([Icon, label, value, body]) => (
                <Card key={label} className="bg-card/88">
                  <CardContent className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-muted p-2 text-primary"><Icon size={20} /></div>
                      <div>
                        <div className="text-sm font-semibold text-foreground/72">{label}</div>
                        <div className="mt-1 text-sm text-foreground/55">{body}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-black text-primary">{value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <NarrativeSection />

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-foreground/58 md:flex-row md:items-center md:justify-between">
          <BrandMark />
          <span>{BRAND.tagline}</span>
        </div>
      </footer>
    </div>
  );
}

function NarrativeSection() {
  const sections = [
    [Lock, "Private mentorship", "Mentors and mentees can keep sensitive sessions and feedback pair-only with clear trust indicators."],
    [Eye, "Scoped observers", "Managers and HR partners can follow progress without intruding on private content."],
    [BarChart3, "Measured growth", "KRAs, KPI history, trend charts, and risk alerts make development visible over time."],
    [Network, "Operational clarity", "Every pairing has sessions, next steps, feedback, observers, and progress in one system."]
  ];

  return (
    <section className="border-y border-border bg-card/54">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-black tracking-normal sm:text-4xl">From guidance to growth, all in one trusted system.</h2>
          <p className="mt-4 text-foreground/62">
            MentorPulse turns scattered notes, forgotten follow-ups, and unclear goals into a governed mentorship workflow.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sections.map(([Icon, title, body], index) => (
            <motion.div
              key={title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:-translate-y-1 hover:border-primary/35">
                <CardContent>
                  <Icon className="mb-4 text-primary" />
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/60">{body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
