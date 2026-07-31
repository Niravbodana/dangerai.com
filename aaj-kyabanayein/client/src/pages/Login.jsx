import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate("/recipes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="glass-strong rounded-2xl p-8">
          <BrandLogo light className="mb-6 h-9 w-auto" />
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--text-secondary)]">
            Log in to save favorites, meal plans, and your cooking history.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="you@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="••••••" />
            </div>
            <button type="submit" disabled={loading} className="premium-btn w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-[var(--accent-soft)] hover:underline">
              Sign up free
            </Link>
          </p>
          <Link to="/" className="mt-4 block text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
