import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

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
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Signup</h1>
          <p className="mb-6 text-sm text-gray-500">Free account banao — meal plan save hoga</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Naam</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Aapka naam"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="aap@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                placeholder="Kam se kam 6 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Account ban raha hai..." : "Free Account Banao"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Pehle se account hai?{" "}
            <Link to="/login" className="font-semibold text-orange-600 hover:underline">
              Login karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
