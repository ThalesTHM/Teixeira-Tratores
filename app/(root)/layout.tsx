import Navbar from "@/components/layout-global/Navbar";
import { getUserFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toast } from "sonner";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserFromSession();

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