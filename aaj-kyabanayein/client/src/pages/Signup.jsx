import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
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
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Create your account — free for now</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--text-secondary)]">
            Join Rasoira to save recipes, build meal plans, and track what you love to cook.
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="glass-input" placeholder="Your name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="you@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="At least 6 characters" />
            </div>
            <button type="submit" disabled={loading} className="premium-btn w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Creating account..." : "Join — Free for Now"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[var(--accent-soft)] hover:underline">
              Log in
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
