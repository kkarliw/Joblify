import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const role = searchParams.get("role");
    const error = searchParams.get("error");

    if (error) {
      navigate("/login?error=google_auth_failed");
      return;
    }

    if (token && refresh && role) {
      // Store tokens in localStorage
      localStorage.setItem("joblify.token", token);
      localStorage.setItem("joblify.refresh", refresh);

      // Set minimal user data (will be updated by fetchMe)
      const minimalUser: Partial<AuthUser> = {
        role: role as AuthUser["role"],
        name: "Usuario",
        profileCompletion: 10,
      };
      useAuthStore.setState((state) => ({
        ...state,
        token,
        refreshToken: refresh,
      }));
      setUser(minimalUser);

      // Navigate to onboarding (profile needs completion)
      navigate("/onboarding");
    } else {
      navigate("/login?error=auth_failed");
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Completando autenticacion...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
