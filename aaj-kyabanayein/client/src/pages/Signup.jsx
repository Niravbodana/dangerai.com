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
          <BrandLogo className="mb-6 h-9 w-auto" />
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Signup</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--text-secondary)]">
            Optional — bina account ke bhi sab free hai.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50/80 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Naam</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="glass-input" placeholder="Aapka naam" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass-input" placeholder="aap@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass-input" placeholder="Kam se kam 6 characters" />
            </div>
            <button type="submit" disabled={loading} className="premium-btn w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Account ban raha hai..." : "Free Account Banao"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            Pehle se account hai?{" "}
            <Link to="/login" className="font-semibold text-[var(--accent)] hover:underline">
              Login karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
