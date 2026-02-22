"use client";

import dynamic from "next/dynamic";

const Navbar = dynamic(() => import("@/components/layout-global/Navbar"), {
  ssr: false,
});

export default function NavbarClient() {
  return <Navbar />;
}
