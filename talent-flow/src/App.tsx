import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoginClean from "./pages/LoginClean.tsx";
import RegisterClean from "./pages/RegisterClean.tsx";
import RoleSelect from "./pages/RoleSelect.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import HomeFeed from "./pages/HomeFeed.tsx";
import { RoleAppLayout } from "./components/RoleAppLayout.tsx";
import Vacantes from "./pages/Vacantes.tsx";
import VacanteDetalle from "./pages/VacanteDetalle.tsx";
import Freelancer from "./pages/Freelancer.tsx";
import Empresa from "./pages/Empresa.tsx";
import EmpresaDetalle from "./pages/EmpresaDetalle.tsx";
import Comunidad from "./pages/Comunidad.tsx";
import Feed from "./pages/Feed.tsx";
import Publicar from "./pages/Publicar.tsx";

// Dashboards
import TalentoDashboard from "./pages/app/TalentoDashboard.tsx";
import EmpresaDashboard from "./pages/app/EmpresaDashboard.tsx";
import FreelancerDashboard from "./pages/app/FreelancerDashboard.tsx";
import EmprendedorDashboard from "./pages/app/EmprendedorDashboard.tsx";
import EstudianteDashboard from "./pages/app/EstudianteDashboard.tsx";

// Shared in-panel pages
import FeedPage from "./pages/app/shared/FeedPage.tsx";
import MessagesPage from "./pages/app/shared/MessagesPage.tsx";
import SettingsPage from "./pages/app/shared/SettingsPage.tsx";
import ProfilePage from "./pages/app/shared/ProfilePage.tsx";
import { PublicProfilePage } from "./pages/app/shared/PublicProfilePage.tsx";

// Talento
import TalentoVacantes from "./pages/app/talento/TalentoVacantes.tsx";
import TalentoAplicaciones from "./pages/app/talento/TalentoAplicaciones.tsx";
import TalentoGuardados from "./pages/app/talento/TalentoGuardados.tsx";
import TalentoPerfil from "./pages/app/talento/TalentoPerfilNuevo.tsx";

// Empresa
import EmpresaVacantes from "./pages/app/empresa/EmpresaVacantes.tsx";
import EmpresaCandidatos from "./pages/app/empresa/EmpresaCandidatos.tsx";
import EmpresaPipeline from "./pages/app/empresa/EmpresaPipeline.tsx";
import EmpresaPublicar from "./pages/app/empresa/EmpresaPublicar.tsx";

// Freelancer
import FreelancerProyectos from "./pages/app/freelancer/FreelancerProyectos.tsx";
import FreelancerPropuestas from "./pages/app/freelancer/FreelancerPropuestas.tsx";

// Startup
import StartupProyectos from "./pages/app/startup/StartupProyectos.tsx";
import StartupCofounders from "./pages/app/startup/StartupCofounders.tsx";
import StartupPostulantes from "./pages/app/startup/StartupPostulantes.tsx";
import StartupPublicar from "./pages/app/startup/StartupPublicar.tsx";
import StartupProyectoDetalle from "./pages/app/startup/StartupProyectoDetalle.tsx";

// Estudiante
import Practicas from "./pages/app/estudiante/Practicas.tsx";
import Recursos from "./pages/app/estudiante/Recursos.tsx";
import RecursoDetalle from "./pages/app/estudiante/RecursoDetalle.tsx";
import { useAuthStore } from "./store/authStore";
import { authApi } from "./lib/api";
import { hasRealSession } from "./lib/session";

const queryClient = new QueryClient();

const resetAuthState = () => {
  queryClient.clear();
  localStorage.removeItem("joblify.token");
  localStorage.removeItem("joblify.refresh");
  localStorage.removeItem("joblify.user");
  localStorage.removeItem("joblify.auth");
  localStorage.removeItem("joblify.session");
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    onboardingDone: false,
    isLoading: false,
    error: null,
  });
};

const getRoleHome = (role?: string | null) => {
  switch (role) {
    case "estudiante":
      return "/app/estudiante/practicas";
    case "candidato":
      return "/app/talento/vacantes";
    case "empresa":
      return "/app/empresa/vacantes";
    case "freelancer":
      return "/app/freelancer/proyectos";
    case "emprendedor":
    case "startup":
      return "/app/startup/proyectos";
    default:
      return null;
  }
};

const MarketingRoute = ({ element }: { element: JSX.Element }) => {
  const location = useLocation();
  const { user, token, refreshToken } = useAuthStore.getState();
  const hasSession = hasRealSession(user, token, refreshToken);
  const destination = getRoleHome(user?.role);
  const params = new URLSearchParams(location.search);
  const isExplicitPublic = params.get("public") === "1";

  if (hasSession && destination && !isExplicitPublic) {
    return <Navigate to={destination} replace />;
  }

  return element;
};

const SessionBootstrap = ({ children }: { children: ReactNode }) => {
  const { token, refreshToken } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const storedToken = localStorage.getItem("joblify.token");
      const storedRefreshToken = localStorage.getItem("joblify.refresh");

      if (!storedToken || !storedRefreshToken) {
        resetAuthState();
        if (isMounted) setReady(true);
        return;
      }

      if (!token || !refreshToken) {
        useAuthStore.setState((state) => ({
          ...state,
          token: storedToken,
          refreshToken: storedRefreshToken,
        }));
      }

      try {
        const { data } = await authApi.me();
        if (!isMounted) return;

        useAuthStore.setState((state) => ({
          ...state,
          user: { ...data, role: data.role.toLowerCase() },
          token: storedToken,
          refreshToken: storedRefreshToken,
        }));
      } catch {
        if (!isMounted) return;
        resetAuthState();
      } finally {
        if (isMounted) setReady(true);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token, refreshToken]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

const FeedProtectedRoute = () => {
  const { user, token, refreshToken } = useAuthStore();
  return hasRealSession(user, token, refreshToken) ? <Feed /> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SessionBootstrap>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginClean />} />
          <Route path="/login/elegir" element={<RoleSelect mode="login" />} />
          <Route path="/register" element={<RegisterClean />} />
          <Route path="/register/elegir" element={<RoleSelect mode="register" />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public marketing pages */}
          <Route path="/vacantes" element={<MarketingRoute element={<Vacantes />} />} />
          <Route path="/vacantes/:id" element={<MarketingRoute element={<VacanteDetalle />} />} />
          <Route path="/freelancers" element={<Freelancer />} />
          <Route path="/empresa" element={<MarketingRoute element={<Empresa />} />} />
          <Route path="/empresa/:id" element={<MarketingRoute element={<EmpresaDetalle />} />} />
          <Route path="/comunidad" element={<Comunidad />} />
          <Route path="/feed" element={<FeedProtectedRoute />} />
          <Route path="/publicar" element={<Publicar />} />

          {/* Talento */}
          <Route path="/app/talento" element={<RoleAppLayout />}>
            <Route index element={<FeedPage role="candidato" />} />
            <Route path="panel" element={<HomeFeed />} />
            <Route path="vacantes" element={<TalentoVacantes />} />
            <Route path="vacantes/:id" element={<VacanteDetalle />} />
            <Route path="empresas" element={<Empresa />} />
            <Route path="empresas/:id" element={<EmpresaDetalle />} />
            <Route path="aplicaciones" element={<TalentoAplicaciones />} />
            <Route path="guardados" element={<TalentoGuardados />} />
            <Route path="mensajes" element={<MessagesPage />} />
            <Route path="perfil" element={<TalentoPerfil />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          {/* Empresa */}
          <Route path="/app/empresa" element={<RoleAppLayout />}>
            <Route index element={<EmpresaDashboard />} />
            <Route path="feed" element={<FeedPage role="empresa" />} />
            <Route path="vacantes" element={<EmpresaVacantes />} />
            <Route path="vacantes/:id" element={<VacanteDetalle />} />
            <Route path="empresas" element={<Empresa />} />
            <Route path="empresas/:id" element={<EmpresaDetalle />} />
            <Route path="candidatos" element={<EmpresaCandidatos />} />
            <Route path="pipeline" element={<EmpresaPipeline />} />
            <Route path="publicar" element={<EmpresaPublicar />} />
            <Route path="mensajes" element={<MessagesPage />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          {/* Freelancer */}
          <Route path="/app/freelancer" element={<RoleAppLayout />}>
            <Route index element={<HomeFeed />} />
            <Route path="feed" element={<FeedPage role="freelancer" />} />
            <Route path="proyectos" element={<FreelancerProyectos />} />
            <Route path="propuestas" element={<FreelancerPropuestas />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="mensajes" element={<MessagesPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          {/* Emprendedor / Startup */}
          <Route path="/app/startup" element={<RoleAppLayout />}>
            <Route index element={<HomeFeed />} />
            <Route path="feed" element={<FeedPage role="emprendedor" />} />
            <Route path="proyectos" element={<StartupProyectos />} />
            <Route path="proyectos/:id" element={<StartupProyectoDetalle />} />
            <Route path="cofounders" element={<StartupCofounders />} />
            <Route path="postulantes" element={<StartupPostulantes />} />
            <Route path="publicar" element={<StartupPublicar />} />
            <Route path="mensajes" element={<MessagesPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          {/* Estudiante */}
          <Route path="/app/estudiante" element={<RoleAppLayout />}>
            <Route index element={<EstudianteDashboard />} />
            <Route path="feed" element={<FeedPage role="estudiante" />} />
            <Route path="practicas" element={<Practicas />} />
            <Route path="vacantes/:id" element={<VacanteDetalle />} />
            <Route path="empresas" element={<Empresa />} />
            <Route path="empresas/:id" element={<EmpresaDetalle />} />
            <Route path="recursos" element={<Recursos />} />
            <Route path="recursos/:resourceId" element={<RecursoDetalle />} />
            <Route path="aplicaciones" element={<TalentoAplicaciones />} />
            <Route path="mensajes" element={<MessagesPage />} />
            <Route path="perfil/:id" element={<PublicProfilePage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionBootstrap>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
