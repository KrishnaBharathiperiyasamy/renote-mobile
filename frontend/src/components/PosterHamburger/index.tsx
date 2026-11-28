"use client";
import { Menu } from "lucide-react";
import MobileSidebar from "@components/Sidebar/page";
import { useState } from "react";

export default function PosterHamburgerHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        className="fixed top-2 left-2 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-[#FF5722] hover:bg-[#FF7043] shadow-md transition cursor-pointer"
        onClick={() => setIsSidebarOpen(true)}
        title="Open Menu"
      >
        <Menu className="w-[18px] h-[18px] text-white stroke-[2]" />
      </button>

      {/* Sidebar */}
      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
}
