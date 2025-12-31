import Navbar from "@/components/layout-global/Navbar";
import { SessionService } from "@/services/session/SessionService";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    redirect("/auth/login?redirected=true");
  }
  
  return (
    <main>
      <Navbar/>
      {children}
    </main>
  );
  }