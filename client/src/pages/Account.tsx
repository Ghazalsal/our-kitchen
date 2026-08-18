import { CheckCircle2, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { StorefrontShell } from "@/components/StorefrontShell";
import { useAuth } from "@/contexts/AuthContext";

const fieldClass = "w-full border-b border-[#BFAE9E] bg-transparent py-3 text-sm outline-none transition focus:border-[#C0632D]";

function AccountFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <StorefrontShell><main className="container grid min-h-[70vh] place-items-center py-12"><section className="paper-panel w-full max-w-md p-7 md:p-9"><p className="eyebrow">{eyebrow}</p><h1 className="mt-3 text-4xl leading-[0.95]">{title}</h1>{children}</section></main></StorefrontShell>;
}

export function Login() {
  const { login } = useAuth(); const [, setLocation] = useLocation(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { const user = await login({ email, password }); toast.success(`Welcome back, ${user.name}.`); setLocation(user.role === "admin" ? "/admin" : "/account"); } catch (error) { toast.error(error instanceof Error ? error.message : "Sign-in failed."); } finally { setSaving(false); } };
  return <AccountFrame eyebrow="Account sign in" title="Welcome back to the counter."><form onSubmit={submit} className="mt-7 grid gap-5"><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} /></label><button disabled={saving} className="copper-button mt-2 w-full"><KeyRound size={16} /> {saving ? "Signing in…" : "Sign in"}</button></form><div className="mt-6 flex justify-between text-xs text-[#8A4A27]"><Link href="/forgot-password">Forgot password?</Link><Link href="/register">Create account</Link></div></AccountFrame>;
}

export function Register() {
  const { register } = useAuth(); const [, setLocation] = useLocation(); const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" }); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); try { await register(form); toast.success("Your account is ready. Check the verification message in the local mail log during development."); setLocation("/account"); } catch (error) { toast.error(error instanceof Error ? error.message : "Registration failed."); } finally { setSaving(false); } };
  return <AccountFrame eyebrow="Create account" title="Keep your kitchen in one place."><form onSubmit={submit} className="mt-7 grid gap-5"><label>Full name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></label><label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} /></label><label>Password <small className="font-normal text-[#73675E]">12+ characters</small><input required minLength={12} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={fieldClass} /></label><label>Confirm password<input required type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} className={fieldClass} /></label><button disabled={saving} className="copper-button mt-2 w-full"><UserRound size={16} /> {saving ? "Creating account…" : "Create account"}</button></form><p className="mt-5 text-center text-xs text-[#73675E]">Already have an account? <Link href="/login" className="text-[#8A4A27]">Sign in</Link></p></AccountFrame>;
}

export function ForgotPassword() {
  const { forgotPassword } = useAuth(); const [email, setEmail] = useState(""); const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); try { toast.success(await forgotPassword(email)); setSent(true); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send reset instructions."); } };
  return <AccountFrame eyebrow="Account recovery" title="Set a new password."><p className="mt-4 text-sm leading-6 text-[#73675E]">Enter your account email and we will issue a time-limited reset link. In this development workspace, Laravel writes it to the local mail log.</p><form onSubmit={submit} className="mt-7 grid gap-5"><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} /></label><button className="copper-button w-full"><Mail size={16} /> Send reset link</button></form>{sent && <p className="mt-5 flex gap-2 text-sm text-[#526349]"><CheckCircle2 size={17} /> Reset instructions requested.</p>}<p className="mt-5 text-center text-xs"><Link href="/login" className="text-[#8A4A27]">Return to sign in</Link></p></AccountFrame>;
}

export function ResetPassword() {
  const [, setLocation] = useLocation(); const { resetPassword } = useAuth(); const query = new URLSearchParams(window.location.search); const token = query.get("token") ?? ""; const [form, setForm] = useState({ email: query.get("email") ?? "", password: "", password_confirmation: "" });
  const submit = async (event: FormEvent) => { event.preventDefault(); try { toast.success(await resetPassword({ ...form, token })); setLocation("/login"); } catch (error) { toast.error(error instanceof Error ? error.message : "Password could not be reset."); } };
  if (!token) return <AccountFrame eyebrow="Reset password" title="That link is incomplete."><p className="mt-5 text-sm text-[#73675E]">Request a fresh password-reset link to continue.</p><Link href="/forgot-password" className="ink-button mt-6">Request reset</Link></AccountFrame>;
  return <AccountFrame eyebrow="Reset password" title="Choose a new password."><form onSubmit={submit} className="mt-7 grid gap-5"><label>Account email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={fieldClass} /></label><label>New password<input required minLength={12} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className={fieldClass} /></label><label>Confirm new password<input required type="password" value={form.password_confirmation} onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })} className={fieldClass} /></label><button className="copper-button mt-2 w-full"><ShieldCheck size={16} /> Update password</button></form></AccountFrame>;
}

export function Account() {
  const { user, loading, logout, resendVerification } = useAuth(); const [, setLocation] = useLocation();
  useEffect(() => { if (!loading && !user) setLocation("/login"); }, [loading, setLocation, user]);
  if (loading) return <AccountFrame eyebrow="Account" title="Opening your kitchen…"><p className="mt-5 text-sm text-[#73675E]">Checking your secure session.</p></AccountFrame>;
  if (!user) return null;
  return <AccountFrame eyebrow="Your account" title={`Hello, ${user.name.split(" ")[0]}.`}><div className="mt-7 grid gap-4 text-sm"><div className="border-y border-[#E6D7C7] py-4"><b className="block">{user.email}</b><span className={user.emailVerified ? "text-[#526349]" : "text-[#8A4A27]"}>{user.emailVerified ? "Email verified" : "Email verification pending"}</span></div>{!user.emailVerified && <button onClick={() => resendVerification().then(toast.success).catch((error: Error) => toast.error(error.message))} className="ink-button w-full">Resend verification email</button>}<Link href="/track" className="copper-button w-full">View order tracking</Link>{user.role === "admin" && <Link href="/admin" className="ink-button w-full">Open atelier desk</Link>}<button onClick={() => logout().then(() => setLocation("/"))} className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8A4A27]">Sign out</button></div></AccountFrame>;
}
