import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import CookingMode from './pages/CookingMode';
import Favorites from './pages/Favorites';
import Planner from './pages/Planner';
import Pantry from './pages/Pantry';
import HealthyWeek from './pages/HealthyWeek';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main className="pb-20 md:pb-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/cook/:id" element={<CookingMode />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/pantry" element={<Pantry />} />
              <Route path="/healthy-week" element={<HealthyWeek />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <MobileNav />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}
