"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  Store, BarChart2, Tag, Settings, LogOut,
  Bell, Search, ChevronDown, Menu, X, Bot, Truck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Commandes", icon: ShoppingBag, badge: null },
  { href: "/dashboard/products", label: "Produits", icon: Package },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/stores", label: "Magasins", icon: Store },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/dashboard/promotions", label: "Promotions", icon: Tag },
  { href: "/dashboard/skin-scans", label: "Skin Scans", icon: Search },
  { href: "/dashboard/skin-coach", label: "Skin Coach IA", icon: Bot },
  { href: "/dashboard/delivery", label: "Livraison", icon: Truck },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const Sidebar = () => (
    <aside className="w-[220px] shrink-0 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2A2424] flex items-center justify-center shadow-md shrink-0">
          <span className="text-lg">🌿</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#2A2424] leading-tight">The Welfare</p>
          <p className="text-[10px] text-[#2A2424]/40 leading-tight">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#2A2424] text-white shadow-md"
                  : "text-[#2A2424]/60 hover:bg-[#2A2424]/8 hover:text-[#2A2424]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[#EDE0E0]">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#F4EAEB] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#C08A8E]">A</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#2A2424] truncate">Admin</p>
            <p className="text-[10px] text-[#2A2424]/40 truncate">admin@thewelfare.store</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#2A2424]/50 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Se déconnecter
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col bg-white border-r border-[#EDE0E0] h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white w-[220px] lg:hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE0E0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2A2424] flex items-center justify-center">
                    <span>🌿</span>
                  </div>
                  <span className="text-sm font-bold text-[#2A2424]">The Welfare</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-[#2A2424]/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-[#EDE0E0] px-5 lg:px-8 py-3.5 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-[#2A2424]/60 hover:bg-[#F4EAEB] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-[#2A2424]/30 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher une commande, un produit..."
                className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 text-[#2A2424]/50 hover:bg-[#F4EAEB] rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C08A8E] rounded-full" />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-[#F5F0EB] rounded-xl hover:bg-[#F4EAEB] transition-colors">
              <div className="w-7 h-7 rounded-full bg-[#2A2424] flex items-center justify-center">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#2A2424]/40" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
