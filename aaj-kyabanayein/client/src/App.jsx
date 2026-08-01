import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import OfflineBanner from './components/OfflineBanner';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import CookingMode from './pages/CookingMode';
import Favorites from './pages/Favorites';
import Planner from './pages/Planner';
import Pantry from './pages/Pantry';
import HealthyWeek from './pages/HealthyWeek';
import Pricing from './pages/Pricing';
import RecipeReview from './pages/RecipeReview';
import AddMeal from './pages/AddMeal';
import MyMeals from './pages/MyMeals';
import Today from './pages/Today';
import Collections from './pages/Collections';
import TasteProfilePage from './pages/TasteProfile';
import Family from './pages/Family';
import StreakPage from './pages/Streak';
import NotFound from './pages/NotFound';

function AuthRouteHandler() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { openLogin, openSignup } = useAuthModal();

  useEffect(() => {
    const auth = params.get('auth');
    if (auth === 'login') openLogin();
    if (auth === 'signup') openSignup();
    if (auth) navigate('/', { replace: true });
  }, [params, openLogin, openSignup, navigate]);

  return null;
}

function AppContent() {
  return (
    <div className="app-shell">
      <OfflineBanner />
      <AuthRouteHandler />
      <Navbar />
      <main className="pb-20 md:pb-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:id" element={<Collections />} />
          <Route path="/taste" element={<TasteProfilePage />} />
          <Route path="/family" element={<Family />} />
          <Route path="/streak" element={<StreakPage />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/cook/:id" element={<CookingMode />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/healthy-week" element={<HealthyWeek />} />
          <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
          <Route path="/signup" element={<Navigate to="/?auth=signup" replace />} />
          <Route path="/recipe/:id/review" element={<RecipeReview />} />
          <Route path="/add-meal" element={<AddMeal />} />
          <Route path="/my-meals" element={<MyMeals />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
      <AuthModal />
    </div>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const tree = (
    <LanguageProvider>
      <AuthProvider>
        <AuthModalProvider>
          <AppContent />
        </AuthModalProvider>
      </AuthProvider>
    </LanguageProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}
