import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      navigate("/planner");
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
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Login</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--text-secondary)]">
            Optional — preferences account me save karne ke liye
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50/80 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="aap@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="••••••" />
            </div>
            <button type="submit" disabled={loading} className="premium-btn w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Login ho raha hai..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Account nahi hai?{" "}
            <Link to="/signup" className="font-semibold text-[var(--accent)] hover:underline">
              Signup karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
