
"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { sdk } from "@/lib/medusa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  Star,
  SignOut,
  Heart,
  Sparkle,
  ArrowRight,
  ChartLine,
  Seal,
  Scan,
  Calendar,
  List,
  X,
  User,
  House,
  ShoppingBag
} from "@phosphor-icons/react";
import Link from "next/link";
import { OrderCard } from "@/components/account/OrderCard";
import { OrderDetailsTab } from "@/components/account/OrderDetailsTab";
import ProfileTab from "@/components/account/ProfileTab";

import { useSkinCoachStore } from "@/lib/store/use-skin-coach-store";

// Animated counter hook
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || target === 0) return;
    started.current = true;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

type TierType = { name: string; min: number; max: number; color: string; icon: typeof Star };

const loyaltyTiers: TierType[] = [
  { name: "Découverte", min: 0, max: 500, color: "#8B7B7B", icon: Star },
  { name: "Bien-être", min: 500, max: 1500, color: "#C97C85", icon: Heart },
  { name: "Prestige", min: 1500, max: 3000, color: "#9B59B6", icon: Seal },
  { name: "Élite", min: 3000, max: Infinity, color: "#F59E0B", icon: Sparkle },
];

function getTier(points: number): TierType {
  const found = loyaltyTiers.find((t) => points >= t.min && points < t.max);
  return (found ?? loyaltyTiers[0]) as TierType;
}

function getNextTier(points: number): TierType | null {
  const idx = loyaltyTiers.findIndex((t) => points >= t.min && points < t.max);
  return idx >= 0 && idx < loyaltyTiers.length - 1 ? (loyaltyTiers[idx + 1] as TierType) : null;
}

export default function AccountPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "scans" | "profile">("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const router = useRouter();
  
  const setSkinCoachResult = useSkinCoachStore((state) => state.setResult);

  
  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      const { customer } = await sdk.store.customer.retrieve();
      if (!customer) {
        router.push("/account/login");
        return;
      }
      setCustomer(customer);
      const { orders } = await sdk.store.order.list();
      setOrders(orders || []);
      
      try {
        const res: any = await sdk.client.fetch("/store/skin-scans", { method: "GET" });
        setScans(res.scans || []);
      } catch (e) {
        console.error("Failed to fetch skin scans", e);
      }

    } catch (err) {
      console.error(err);
      router.push("/account/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [router]);


  const handleLogout = async () => {
    try {
      await sdk.auth.logout();
      router.push("/account/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleViewScan = (scan: any) => {
    setSkinCoachResult({
      final_skin_type: scan.final_skin_type,
      estimated_skin_age: scan.estimated_skin_age,
      melanin_phototype: scan.melanin_phototype,
      empathetic_message: scan.qwen_raw_summary || "Voici votre diagnostic personnalisé.",
      kbeauty_routine: scan.routine || [],
      metrics: scan.metrics,
        id: scan.id
      } as any);
    router.push("/skin-coach/result");
  };

  const loyaltyPoints = orders.reduce(
    (acc, order) => acc + Math.floor((order.total || 0) / 100),
    0
  );
  const animatedPoints = useCounter(loyaltyPoints);
  const tier = getTier(loyaltyPoints) ?? loyaltyTiers[0];
  const nextTier = getNextTier(loyaltyPoints);
  const progressPct = nextTier
    ? Math.min(100, ((loyaltyPoints - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#cd858d]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-2 rounded-full bg-[#cd858d]"
                animate={{ scale: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-xs text-[#2A2424]/40 tracking-widest uppercase mt-2">Chargement</p>
          </div>
        </div>
    );
  }

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: House },
    { id: "orders", label: "Mes commandes", icon: Package },
    { id: "scans", label: "Diagnostics IA", icon: Scan },
    { id: "profile", label: "Profil & Préférences", icon: User },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FDF8F8] flex flex-col md:flex-row items-stretch">
      
      {/* Sidebar (Desktop) / Top Section (Mobile) */}
      <aside className="w-full md:w-72 md:sticky md:top-[80px] md:h-[calc(100vh-80px)] bg-[#2A2424] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-5 md:p-8 flex-1 flex flex-col">
          {/* User Info */}
          <div className="mb-6 md:mb-10 flex items-center justify-between md:block">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#F4EAEB]/40 mb-1 font-semibold">Mon Espace</p>
              <h2 className="text-lg md:text-xl text-[#F4EAEB]">{customer?.first_name} {customer?.last_name}</h2>
            </div>
            
            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-[#F4EAEB]/60 hover:text-[#C97C85] bg-white/5 rounded-full"
            >
              <SignOut className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-4 md:pb-0 mb-2 md:mb-0 no-scrollbar snap-x">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`snap-start whitespace-nowrap md:w-full flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? "bg-[#F4EAEB]/10 text-[#C97C85]" 
                      : "text-[#F4EAEB]/60 hover:text-[#F4EAEB] hover:bg-[#F4EAEB]/5 bg-white/5 md:bg-transparent"
                  }`}
                >
                  <item.icon weight={isActive ? "fill" : "regular"} className="w-4 h-4 md:w-5 md:h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom section (Desktop only or just styled nicely) */}
          <div className="mt-auto pt-6 border-t border-[#F4EAEB]/10 hidden md:block">
            <div className="bg-white/5 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <tier.icon weight="fill" className="w-5 h-5" style={{ color: tier.color }} />
                <div>
                  <p className="text-xs text-[#F4EAEB]/50">{tier.name}</p>
                  <p className="text-sm font-semibold text-[#F4EAEB]">{animatedPoints.toLocaleString("fr-FR")} pts</p>
                </div>
              </div>
              {nextTier && (
                <div>
                  <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#F4EAEB]/40 text-right">
                    Plus que {(nextTier.min - loyaltyPoints).toLocaleString("fr-FR")} pts avant {nextTier.name}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#F4EAEB]/60 hover:text-[#c97c85] transition-colors"
            >
              <SignOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-hidden">
        <div className="max-w-5xl mx-auto p-4 sm:p-8">
          
          {selectedOrder ? (
            <OrderDetailsTab order={selectedOrder} onBack={() => setSelectedOrder(null)} />
          ) : (
            <AnimatePresence mode="wait">

            
            {/* ------------------------- DASHBOARD TAB ------------------------- */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                
                {/* Hero Block (Glamour Edition) */}
                <div className="relative rounded-[2rem] p-8 sm:p-12 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 bg-white/40 backdrop-blur-3xl">
                  {/* Animated Background Orbs */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-[#E5B6B9] rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-pulse" style={{ animationDuration: '8s' }}></div>
                  <div className="absolute -bottom-8 right-32 w-72 h-72 bg-[#C97C85] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
                  <div className="absolute top-1/2 left-0 w-64 h-64 bg-[#F1EFEA] rounded-full mix-blend-multiply filter blur-[60px] opacity-40 animate-pulse" style={{ animationDuration: '12s' }}></div>
                  
                  <div className="relative z-10">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/50 shadow-sm text-xs font-semibold tracking-wide text-[#C97C85] mb-6"
                    >
                      <Sparkle className="w-3.5 h-3.5" weight="fill" />
                      MEMBRE DEPUIS {new Date(customer?.created_at).getFullYear()}
                    </motion.div>
                    
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-4xl sm:text-5xl font-bold text-[#2A2424] mb-4 leading-[1.15]"
                    >
                      Bonjour {customer?.first_name},<br />
                      <span className="italic bg-clip-text text-transparent bg-gradient-to-r from-[#C97C85] via-[#E5B6B9] to-[#C97C85] bg-[length:200%_auto] animate-gradient-x">
                        bienvenue dans votre espace.
                      </span>
                    </motion.h1>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-[#2A2424]/70 text-sm sm:text-base max-w-md leading-relaxed font-medium"
                    >
                      Retrouvez ici l'historique de vos commandes, votre suivi fidélité et les résultats de vos diagnostics de peau personnalisés.
                    </motion.p>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 flex flex-wrap gap-4"
                    >
                      <Link href="/shop" className="px-7 py-3.5 bg-[#2A2424] text-white text-sm font-semibold rounded-2xl shadow-[0_8px_20px_rgba(42,36,36,0.2)] hover:shadow-[0_12px_25px_rgba(42,36,36,0.3)] hover:-translate-y-[2px] transition-all duration-300 flex items-center gap-2 group">
                        Découvrir la boutique
                        <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link href="/skin-coach" className="px-7 py-3.5 bg-white/80 backdrop-blur-md text-[#2A2424] border border-white shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] text-sm font-semibold rounded-2xl hover:bg-white hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-300 flex items-center gap-2">
                        <Scan weight="bold" className="w-4 h-4 text-[#C97C85]" />
                        Lancer un diagnostic IA
                      </Link>
                    </motion.div>
                  </div>
                </div>

                {/* KPI Cards (Glamour Edition) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: "Commandes", value: orders.length, icon: Package,
  Truck, color: "#cd858d", glow: "rgba(205,133,141,0.15)", delay: 0.1 },
                    { label: "Scans IA", value: scans.length, icon: Scan, color: "#cd858d", glow: "rgba(205,133,141,0.15)", delay: 0.2 },
                    { label: "Fidélité", value: loyaltyPoints.toLocaleString('fr-FR'), icon: Star, color: "#cd858d", glow: "rgba(205,133,141,0.15)", delay: 0.3 },
                    { label: "Statut", value: tier.name, icon: Seal, color: "#cd858d", glow: "rgba(205,133,141,0.15)", delay: 0.4 },
                  ].map((stat) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stat.delay, duration: 0.5, ease: "easeOut" }}
                      className="group relative bg-white/60 backdrop-blur-2xl rounded-3xl p-6 border border-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:bg-white transition-all duration-500 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div 
                        className="relative w-12 h-12 rounded-full flex items-center justify-center mb-5 bg-gradient-to-b from-white to-gray-50/50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] border border-gray-100"
                        style={{ boxShadow: `0 8px 16px -4px ${stat.glow}, inset 0 2px 4px rgba(255,255,255,0.8)` }}
                      >
                        <stat.icon weight="fill" className="w-5 h-5 transition-transform duration-500 group-hover:scale-110" style={{ color: stat.color }} />
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-3xl font-bold text-[#2A2424] mb-1" style={{ letterSpacing: "-0.03em" }}>{stat.value}</p>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                
                  {/* Dashboard - Dernières Commandes (Full Width) */}
                  <div className="mt-8">
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">Historique et acheminement</p>
                        <h2 className="text-2xl text-[#2A2424]">Dernières Commandes</h2>
                      </div>
                      <button onClick={() => setActiveTab('orders')} className="text-sm font-medium text-gray-500 hover:text-[#C97C85] transition-colors flex items-center gap-1">
                        Toutes mes commandes ({orders.length}) <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {orders.length > 0 ? (
                      <div>
                        {orders.slice(0, 2).map((order: any) => (
                          <OrderCard key={order.id} order={order} onViewDetails={setSelectedOrder} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Vous n&apos;avez pas encore de commande.</p>
                      </div>
                    )}
                  </div>


                  
                  {/* Dashboard - Derniers Diagnostics */}
                  <div className="mt-16 mb-8 pt-8 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#cd858d] to-[#e4a8b0] text-white flex items-center justify-center shadow-md shadow-[#cd858d]/20">
                          <Sparkle weight="fill" className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl text-[#2A2424] flex items-center gap-2">
                            Coach Beauté IA <span className="px-2 py-0.5 bg-[#FAF5F0] text-[#cd858d] text-[9px] rounded-full uppercase tracking-widest font-sans font-bold border border-[#F1E5D8]">Bêta</span>
                          </h2>
                          <p className="text-sm text-gray-500 mt-0.5">Votre expert dermo-cosmétique personnel</p>
                        </div>
                      </div>
                      <button onClick={() => setActiveTab('scans')} className="text-xs font-bold tracking-widest uppercase text-[#cd858d] hover:text-[#b5737a] transition-colors flex items-center gap-1">
                        Historique ({scans.length}) <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {scans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {scans.slice(0, 2).map((scan: any) => (
                          <div key={scan.id} className="relative overflow-hidden bg-white rounded-3xl border border-[#F1E5D8] p-1.5 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleViewScan(scan)}>
                            {/* Soft gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#FAF5F0] via-white to-white opacity-80 z-0"></div>
                            
                            {/* Glowing orb effect */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#cd858d] rounded-full mix-blend-multiply filter blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            
                            <div className="relative z-10 bg-white rounded-[1.35rem] p-6 h-full flex flex-col border border-gray-50/50">
                              <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#cd858d]">
                                  <Scan className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-2 bg-[#FAF5F0] rounded-lg text-[10px] font-bold tracking-widest uppercase text-[#cd858d] leading-relaxed">
                                  Peau {scan.final_skin_type}
                                </span>
                              </div>
                              
                              <h3 className="text-lg font-bold text-[#2A2424] mb-1">
                                Votre rituel sur-mesure
                              </h3>
                              <p className="text-xs text-gray-400 font-medium mb-4">
                                Analysé le {new Date(scan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              
                              <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed flex-grow">
                                {scan.qwen_raw_summary || "Routine personnalisée générée par notre intelligence artificielle suite à votre diagnostic de peau."}
                              </p>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleViewScan(scan); }}
                                className="mt-auto w-full py-3 bg-[#FAF5F0] text-[#cd858d] text-xs font-bold uppercase tracking-widest rounded-xl group-hover:bg-[#cd858d] group-hover:text-white transition-colors flex items-center justify-center gap-2"
                              >
                                Consulter la routine <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-[2rem] border border-[#F1E5D8] bg-white p-8 md:p-12 text-center shadow-sm">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#cd858d] rounded-full mix-blend-multiply filter blur-[80px] opacity-10"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FAF5F0] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-3xl bg-[#FAF5F0] text-[#cd858d] flex items-center justify-center mb-6 shadow-inner border border-white">
                            <Sparkle weight="fill" className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl font-bold text-[#2A2424] mb-3">
                            Découvrez les besoins de votre peau
                          </h3>
                          <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                            Notre intelligence artificielle analyse votre visage pour créer une routine de soins botanique 100% sur-mesure.
                          </p>
                          <Link href="/skin-coach" className="inline-flex items-center gap-2 px-8 py-4 bg-[#cd858d] text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#b5737a] transition-colors shadow-lg shadow-[#cd858d]/20">
                            <Sparkle weight="fill" className="w-4 h-4" />
                            Démarrer l&apos;analyse IA
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
            )}
                  
            {/* ------------------------- ORDERS TAB ------------------------- */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="text-2xl text-[#2A2424] mb-1">Mes commandes</h2>
                    <p className="text-sm text-gray-500">Retrouvez l&apos;historique et le suivi de vos achats.</p>
                  </div>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order: any) => (
                      <OrderCard key={order.id} order={order} onViewDetails={setSelectedOrder} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#2A2424] mb-2">Aucune commande</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                      Vous n&apos;avez pas encore passé de commande sur notre boutique.
                    </p>
                    <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-[#2A2424] text-white text-sm font-medium rounded-xl hover:bg-black transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                      Visiter la boutique
                    </Link>
                  </div>
                )}
              </motion.div>
            )}

                        {/* ------------------------- SCANS TAB ------------------------- */}
            {activeTab === "scans" && (
              <motion.div
                key="scans"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#cd858d] to-[#e4a8b0] text-white flex items-center justify-center shadow-md shadow-[#cd858d]/20">
                      <Sparkle weight="fill" className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl text-[#2A2424] flex items-center gap-2">
                        Diagnostics IA <span className="px-2 py-0.5 bg-[#FAF5F0] text-[#cd858d] text-[9px] rounded-full uppercase tracking-widest font-sans font-bold border border-[#F1E5D8]">Bêta</span>
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">Historique de vos analyses de peau et routines.</p>
                    </div>
                  </div>
                  <Link href="/skin-coach" className="hidden sm:flex items-center gap-2 px-6 py-3 bg-[#cd858d] text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-md shadow-[#cd858d]/20">
                    <Scan className="w-4 h-4" /> Nouveau diagnostic
                  </Link>
                </div>

                {scans.length === 0 ? (
                  <div className="relative overflow-hidden rounded-[2rem] border border-[#F1E5D8] bg-white p-8 md:p-12 text-center shadow-sm">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#cd858d] rounded-full mix-blend-multiply filter blur-[80px] opacity-10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FAF5F0] rounded-full mix-blend-multiply filter blur-[80px] opacity-40"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-3xl bg-[#FAF5F0] text-[#cd858d] flex items-center justify-center mb-6 shadow-inner border border-white">
                        <Sparkle weight="fill" className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-[#2A2424] mb-3">
                        Découvrez les besoins de votre peau
                      </h3>
                      <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto leading-relaxed">
                        Notre intelligence artificielle analyse votre visage pour créer une routine de soins botanique 100% sur-mesure.
                      </p>
                      <Link href="/skin-coach" className="inline-flex items-center gap-2 px-8 py-4 bg-[#cd858d] text-white text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#b5737a] transition-colors shadow-lg shadow-[#cd858d]/20">
                        <Sparkle weight="fill" className="w-4 h-4" />
                        Démarrer l&apos;analyse IA
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scans.map((scan: any) => (
                      <div key={scan.id} className="relative overflow-hidden bg-white rounded-3xl border border-[#F1E5D8] p-1.5 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleViewScan(scan)}>
                        {/* Soft gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF5F0] via-white to-white opacity-80 z-0"></div>
                        
                        {/* Glowing orb effect */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#cd858d] rounded-full mix-blend-multiply filter blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        
                        <div className="relative z-10 bg-white rounded-[1.35rem] p-6 h-full flex flex-col border border-gray-50/50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#FAF5F0] flex items-center justify-center text-[#cd858d]">
                              <Scan className="w-5 h-5" />
                            </div>
                            <span className="px-3 py-2 bg-[#FAF5F0] rounded-lg text-[10px] font-bold tracking-widest uppercase text-[#cd858d] leading-relaxed shadow-sm">
                              Peau {scan.final_skin_type}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-[#2A2424] mb-1">
                            Votre rituel sur-mesure
                          </h3>
                          <p className="text-xs text-gray-400 font-medium mb-4">
                            Analysé le {new Date(scan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          
                          <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed flex-grow">
                            {scan.qwen_raw_summary || "Routine personnalisée générée par notre intelligence artificielle suite à votre diagnostic de peau."}
                          </p>
                          
                          <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">
                            <span>Âge estimé: {scan.estimated_skin_age} ans</span>
                            <span>Photo: {scan.melanin_phototype}</span>
                          </div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewScan(scan); }}
                            className="w-full py-3 bg-[#FAF5F0] text-[#cd858d] text-xs font-bold uppercase tracking-widest rounded-xl group-hover:bg-[#cd858d] group-hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                            Consulter la routine <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            
            {/* ------------------------- PROFILE TAB ------------------------- */}
            {activeTab === "profile" && (
              <ProfileTab 
                key="profile" 
                customer={customer} 
                onUpdate={fetchCustomer} 
              />
            )}

          
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
