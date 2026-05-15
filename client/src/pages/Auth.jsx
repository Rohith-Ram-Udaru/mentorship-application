import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input, Label } from "../components/ui/input";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { BRAND } from "../utils/brand";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validateForm(form, isRegister) {
  const errors = {};
  if (isRegister && !form.name.trim()) errors.name = "Name is required.";
  if (isRegister && !form.title.trim()) errors.title = "Title is required.";
  if (isRegister && !form.department.trim()) errors.department = "Department is required.";
  if (!emailRegex.test(form.email.trim())) errors.email = "Please enter a valid email address.";
  if (!form.password) {
    errors.password = "Password is required.";
  } else if (isRegister && !passwordRegex.test(form.password)) {
    errors.password = "Password must include uppercase, lowercase, number, and special character.";
  }
  return errors;
}

export function Auth({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    title: "",
    department: ""
  });

  const errors = useMemo(() => validateForm(form, isRegister), [form, isRegister]);
  const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([key]) => touched[key] || error));

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setTouched({ name: true, email: true, password: true, title: true, department: true });
    const nextErrors = validateForm(form, isRegister);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await (isRegister ? register(form) : login({ email: form.email, password: form.password }));
      showToast({
        type: "success",
        title: isRegister ? "Workspace ready" : "Secure sign-in complete",
        message: `Welcome to ${BRAND.name}.`
      });
      navigate("/app");
    } catch (err) {
      const message = err.friendlyMessage || err.message || "Unable to connect securely. Please verify credentials or server availability.";
      setError(message);
      showToast({ type: "error", title: "Authentication failed", message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <section className="hidden bg-trust-gradient p-10 lg:flex lg:flex-col lg:justify-between">
        <BrandMark />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm font-semibold text-foreground/68">
            <ShieldCheck size={15} className="text-accent" />
            Enterprise-grade privacy by design
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-normal">
            {BRAND.shortPromise}
          </h1>
          <p className="mt-5 text-lg leading-8 text-foreground/64">
            MentorPulse gives mentors, mentees, and observers a calm, trusted system for continuity,
            feedback, goals, and measurable progress.
          </p>
        </motion.div>
        <div className="grid gap-3 text-sm text-foreground/68">
          {["Pair-only content stays private.", "Feedback visibility is locked at creation.", "Goal history remains auditable."].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-accent" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-md overflow-hidden">
          <CardHeader className="bg-trust-gradient">
            <div className="mb-4"><BrandMark /></div>
            <CardTitle>{isRegister ? "Create your mentorship workspace" : "Sign in securely"}</CardTitle>
            <p className="mt-2 text-sm leading-6 text-foreground/62">
              {isRegister ? BRAND.tagline : "Continue guiding growth with privacy and confidence."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4" noValidate>
              {isRegister && (
                <>
                  <Field label="Full name" error={visibleErrors.name}>
                    <Input
                      value={form.name}
                      placeholder="Aarav Mehta"
                      onBlur={() => setTouched({ ...touched, name: true })}
                      onChange={(e) => update("name", e.target.value)}
                      aria-invalid={Boolean(visibleErrors.name)}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Title" error={visibleErrors.title}>
                      <Input
                        value={form.title}
                        placeholder="Product Lead"
                        onBlur={() => setTouched({ ...touched, title: true })}
                        onChange={(e) => update("title", e.target.value)}
                        aria-invalid={Boolean(visibleErrors.title)}
                      />
                    </Field>
                    <Field label="Department" error={visibleErrors.department}>
                      <Input
                        value={form.department}
                        placeholder="Growth"
                        onBlur={() => setTouched({ ...touched, department: true })}
                        onChange={(e) => update("department", e.target.value)}
                        aria-invalid={Boolean(visibleErrors.department)}
                      />
                    </Field>
                  </div>
                </>
              )}
              <Field label="Email address" error={visibleErrors.email}>
                <Input
                  type="email"
                  value={form.email}
                  placeholder="abc@gmail.com"
                  onBlur={() => setTouched({ ...touched, email: true })}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(visibleErrors.email)}
                />
              </Field>
              <Field label="Password" error={visibleErrors.password}>
                <Input
                  type="password"
                  value={form.password}
                  placeholder="Minimum 8 characters"
                  onBlur={() => setTouched({ ...touched, password: true })}
                  onChange={(e) => update("password", e.target.value)}
                  aria-invalid={Boolean(visibleErrors.password)}
                />
              </Field>
              {error && <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
              <Button className="w-full" type="submit" disabled={submitting}>
                <LockKeyhole size={16} />
                {submitting ? "Securing session..." : isRegister ? "Create Your Mentorship Workspace" : "Sign In"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-foreground/60">
              {isRegister ? "Already have an account?" : "New to MentorPulse?"}{" "}
              <Link className="font-semibold text-primary" to={isRegister ? "/login" : "/register"}>
                {isRegister ? "Sign In" : "Create Your Mentorship Workspace"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
