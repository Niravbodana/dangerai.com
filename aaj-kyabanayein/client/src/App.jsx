import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <Planner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipe/:id"
            element={
              <ProtectedRoute>
                <RecipeDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cook/:id"
            element={
              <ProtectedRoute>
                <CookingMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes"
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pantry"
            element={
              <ProtectedRoute>
                <Pantry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/healthy-week"
            element={
              <ProtectedRoute>
                <HealthyWeek />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
