import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import BrandLogo from "./BrandLogo";

function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const { openSignup } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-2xl text-[var(--text-primary)]">Welcome back</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Log in to save favorites and meal plans.</p>
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="Password" />
        <button type="submit" disabled={loading} className="premium-btn tap-smooth w-full py-3.5 text-sm disabled:opacity-50">
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
        No account?{" "}
        <button type="button" onClick={openSignup} className="font-semibold text-[var(--accent-soft)] hover:underline">
          Sign up free
        </button>
      </p>
    </>
  );
}

function SignupForm({ onSuccess }) {
  const { register } = useAuth();
  const { openLogin } = useAuthModal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display text-2xl text-[var(--text-primary)]">Join Rasoira</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Free account — save recipes & meal plans.</p>
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="glass-input" placeholder="Your name" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="Password (6+ chars)" />
        <button type="submit" disabled={loading} className="premium-btn tap-smooth w-full py-3.5 text-sm disabled:opacity-50">
          {loading ? "Creating..." : "Join Free"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
        Have an account?{" "}
        <button type="button" onClick={openLogin} className="font-semibold text-[var(--accent-soft)] hover:underline">
          Log in
        </button>
      </p>
    </>
  );
}

export default function AuthModal() {
  const { mode, close } = useAuthModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mode) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mode, close]);

  if (!mode) return null;

  const onSuccess = () => {
    close();
    navigate("/recipes");
  };

  return (
    <div className="auth-modal-overlay fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={close} aria-label="Close" />
      <div className="auth-modal-panel relative z-10 w-full max-w-md animate-modal-in rounded-3xl border border-white/15 bg-[#1c1814]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <button
          type="button"
          onClick={close}
          className="tap-smooth absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[var(--text-secondary)] hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
        <BrandLogo light className="mb-6 h-9 w-auto" />
        {mode === "login" ? <LoginForm onSuccess={onSuccess} /> : <SignupForm onSuccess={onSuccess} />}
      </div>
    </div>
  );
}
