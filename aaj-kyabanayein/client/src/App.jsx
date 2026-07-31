import { BrowserRouter, Route, Routes } from "react-router-dom";
import MobileNav from "./components/MobileNav";
import { AuthProvider } from "./context/AuthContext";
import CookingMode from "./pages/CookingMode";
import HealthyWeek from "./pages/HealthyWeek";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Pantry from "./pages/Pantry";
import Planner from "./pages/Planner";
import Pricing from "./pages/Pricing";
import RecipeDetail from "./pages/RecipeDetail";
import Recipes from "./pages/Recipes";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/cook/:id" element={<CookingMode />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/healthy-week" element={<HealthyWeek />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </AuthProvider>
  );
}
