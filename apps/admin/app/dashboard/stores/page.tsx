export default function StoresPage() {
  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2A2424]" style={{ letterSpacing: "-0.02em" }}>Magasins</h1>
        <p className="text-sm text-[#2A2424]/40 mt-0.5">The Welfare Hippodrome & Playce</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#EDE0E0] p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F0EB] flex items-center justify-center mb-4 text-3xl">🏪</div>
        <h2 className="text-base font-bold text-[#2A2424] mb-1">Module en cours de développement</h2>
        <p className="text-sm text-[#2A2424]/40 max-w-xs">La vue par magasin avec les commandes à retirer arrive bientôt.</p>
      </div>
    </div>
  );
}
