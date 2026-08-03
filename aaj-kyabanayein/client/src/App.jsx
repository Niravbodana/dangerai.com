import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Footer from './components/Footer';
import GlobalSeo from './components/GlobalSeo';
import AuthModal from './components/AuthModal';
import LoadingSpinner from './components/LoadingSpinner';
import OfflineBanner from './components/OfflineBanner';
import FirstVisitCoach from './components/FirstVisitCoach';
import Home from './pages/Home';

const Recipes = lazy(() => import('./pages/Recipes'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const CookingMode = lazy(() => import('./pages/CookingMode'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Planner = lazy(() => import('./pages/Planner'));
const Pantry = lazy(() => import('./pages/Pantry'));
const HealthyWeek = lazy(() => import('./pages/HealthyWeek'));
const Pricing = lazy(() => import('./pages/Pricing'));
const RecipeReview = lazy(() => import('./pages/RecipeReview'));
const AddMeal = lazy(() => import('./pages/AddMeal'));
const MyMeals = lazy(() => import('./pages/MyMeals'));
const Today = lazy(() => import('./pages/Today'));
const Collections = lazy(() => import('./pages/Collections'));
const TasteProfilePage = lazy(() => import('./pages/TasteProfile'));
const Family = lazy(() => import('./pages/Family'));
const StreakPage = lazy(() => import('./pages/Streak'));
const NotFound = lazy(() => import('./pages/NotFound'));

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

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <GlobalSeo />
      <OfflineBanner />
      <AuthRouteHandler />
      <Navbar />
      <main id="main-content" className="pb-20 md:pb-8" tabIndex={-1}>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileNav />
      <AuthModal />
      <FirstVisitCoach />
    </div>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const tree = (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthModalProvider>
            <AppContent />
          </AuthModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>;
  }
  return tree;
}
