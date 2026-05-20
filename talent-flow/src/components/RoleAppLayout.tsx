import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { RoleSidebar } from "./RoleSidebar";
import { AppAssistantWidget } from "./AppAssistantWidget";
import { roleToSlug, slugToRole, useAuthStore } from "@/store/authStore";
import { hasRealSession } from "@/lib/session";

export const RoleAppLayout = () => {
  const { pathname } = useLocation();
  const { user, token, refreshToken } = useAuthStore();

  if (!hasRealSession(user, token, refreshToken)) return <Navigate to="/login" replace />;

  // Derive slug from /app/<slug>/...
  const slug = pathname.split("/")[2] || "";
  const expected = slugToRole(slug);
  if (!expected) return <Navigate to={`/app/${roleToSlug(user.role)}`} replace />;
  if (expected !== user.role) return <Navigate to={`/app/${roleToSlug(user.role)}`} replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 w-full mx-auto max-w-[1920px]">
        <RoleSidebar session={{ email: user.email, name: user.name, role: user.role }} />
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 xl:px-16 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
      <AppAssistantWidget />
    </div>
  );
};
