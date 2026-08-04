import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useLanguage } from "../context/LanguageContext";
import { dismissAccountWall } from "../lib/accountWall";
import BrandLogo from "./BrandLogo";
import GoogleSignInButton, { AuthDivider } from "./GoogleSignInButton";

const SIGNUP_COPY = {
  en: {
    cook: {
      title: "Save your cooking streak",
      subtitle: "You've cooked a few meals — create a free account to save favorites, streaks, and meal plans.",
    },
    favorite: {
      title: "Keep your saved recipes",
      subtitle: "Sign up free so your favorites sync across devices and never get lost.",
    },
    default: {
      title: "Join Rasoira",
      subtitle: "Account free for now — save recipes & meal plans.",
    },
  },
  hi: {
    cook: {
      title: "Apni cooking streak save karo",
      subtitle: "Kuch meals ban chuke — free account banao, favorites aur streak phone pe safe rahe.",
    },
    favorite: {
      title: "Saved recipes mat khona",
      subtitle: "Free signup karo — pasand ki recipes har device pe sync rahengi.",
    },
    default: {
      title: "Rasoira join karo",
      subtitle: "Abhi free — recipes save karo aur meal plan banao.",
    },
  },
};

function useGoogleAuth(onSuccess) {
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleGoogleSuccess = async (credential) => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
      onSuccess();
    } catch (err) {
      setGoogleError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return { googleLoading, googleError, setGoogleError, handleGoogleSuccess };
}

function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const { openSignup } = useAuthModal();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { googleLoading, googleError, setGoogleError, handleGoogleSuccess } = useGoogleAuth(onSuccess);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGoogleError("");
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
      <h2 id="auth-modal-title" className="font-display text-2xl text-[var(--text-primary)]">Welcome back</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Log in to save favorites and meal plans.</p>
      {(error || googleError) && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error || googleError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label htmlFor="login-email" className="sr-only">Email</label>
        <input id="login-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="Email" />
        <label htmlFor="login-password" className="sr-only">Password</label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="Password" />
        <button type="submit" disabled={loading || googleLoading} className="premium-btn tap-smooth w-full py-3.5 text-sm disabled:opacity-50">
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>
      <AuthDivider />
      <GoogleSignInButton
        loading={googleLoading}
        onSuccess={handleGoogleSuccess}
        onError={setGoogleError}
      />
      <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
        No account?{" "}
        <button type="button" onClick={openSignup} className="font-semibold text-[var(--accent-soft)] hover:underline">
          Sign up — free for now
        </button>
      </p>
    </>
  );
}

function SignupForm({ onSuccess, signupReason }) {
  const { register } = useAuth();
  const { openLogin, close } = useAuthModal();
  const { t, lang } = useLanguage();
  const copy = (SIGNUP_COPY[lang] || SIGNUP_COPY.en)[signupReason] || (SIGNUP_COPY[lang] || SIGNUP_COPY.en).default;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { googleLoading, googleError, setGoogleError, handleGoogleSuccess } = useGoogleAuth(onSuccess);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGoogleError("");
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
      <h2 id="auth-modal-title" className="font-display text-2xl text-[var(--text-primary)]">{copy.title}</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{copy.subtitle}</p>
      {(error || googleError) && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error || googleError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label htmlFor="signup-name" className="sr-only">Your name</label>
        <input id="signup-name" name="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className="glass-input" placeholder="Your name" />
        <label htmlFor="signup-email" className="sr-only">Email</label>
        <input id="signup-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="Email" />
        <label htmlFor="signup-password" className="sr-only">Password</label>
        <input id="signup-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="Password (6+ chars)" />
        <button type="submit" disabled={loading || googleLoading} className="premium-btn tap-smooth w-full py-3.5 text-sm disabled:opacity-50">
          {loading ? "Creating..." : "Join — Free for Now"}
        </button>
      </form>
      <AuthDivider />
      <GoogleSignInButton
        loading={googleLoading}
        onSuccess={handleGoogleSuccess}
        onError={setGoogleError}
      />
      <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
        Have an account?{" "}
        <button type="button" onClick={openLogin} className="font-semibold text-[var(--accent-soft)] hover:underline">
          Log in
        </button>
      </p>
      <button
        type="button"
        onClick={() => {
          dismissAccountWall();
          close();
        }}
        className="mt-3 w-full text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {t("maybeLater")}
      </button>
    </>
  );
}

export default function AuthModal() {
  const { mode, signupReason, close } = useAuthModal();
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
      <div
        className="auth-modal-panel relative z-10 max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-md animate-modal-in overflow-y-auto rounded-3xl border border-white/15 bg-[#1c1814]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          type="button"
          onClick={close}
          className="tap-smooth absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[var(--text-secondary)] hover:bg-white/10"
          aria-label="Close"
        >
          ✕
        </button>
        <BrandLogo light className="mb-6 h-9 w-auto" />
        {mode === "login" ? <LoginForm onSuccess={onSuccess} /> : <SignupForm onSuccess={onSuccess} signupReason={signupReason} />}
      </div>
    </div>
  );
}
