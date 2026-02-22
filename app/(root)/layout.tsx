import NavbarClient from "@/components/layout-global/NavbarClient";
import { SessionService } from "@/services/session/SessionService";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    redirect("/auth/login?redirected=true");
  }
  
  return (
    <main>
      <NavbarClient/>
      {children}
    </main>
  );
}