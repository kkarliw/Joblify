import { Navbar } from "./Navbar";
import { AppSidebar } from "./AppSidebar";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 max-w-[1400px] w-full mx-auto">
        <AppSidebar />
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">{children}</main>
      </div>
    </div>
  );
};

export const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
};
