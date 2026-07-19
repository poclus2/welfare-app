export function LandingAmbassadrice() {
  return (
    <div className="w-full max-w-[1000px] mx-auto py-20 px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-[#2A2424] mb-6 tracking-tight">Devenez Ambassadrice<br/>The Welfare</h1>
      <p className="text-lg md:text-xl text-[#2A2424]/70 mb-10 max-w-[600px] mx-auto leading-relaxed">
        Rejoignez notre programme d'affiliation et partagez votre passion pour la K-Beauty avec votre communauté.
      </p>
      
      <div className="bg-[#F8F5F2] rounded-[32px] p-8 md:p-12 border border-[#F4EAEB] shadow-sm max-w-[500px] mx-auto relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E5B6B9]/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <h2 className="text-2xl font-bold text-[#2A2424] mb-8 relative z-10">Postulez maintenant</h2>
        <form className="flex flex-col gap-4 relative z-10">
          <input 
            type="text" 
            placeholder="Votre nom" 
            className="w-full bg-white border border-[#F4EAEB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#E5B6B9] transition-colors"
          />
          <input 
            type="email" 
            placeholder="Votre email" 
            className="w-full bg-white border border-[#F4EAEB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#E5B6B9] transition-colors"
          />
          <input 
            type="text" 
            placeholder="Lien de votre réseau social principal" 
            className="w-full bg-white border border-[#F4EAEB] rounded-xl px-4 py-3.5 text-sm outline-none focus:border-[#E5B6B9] transition-colors"
          />
          <button 
            type="button"
            className="w-full bg-[#2A2424] text-white py-4 rounded-full font-bold hover:bg-black transition-colors shadow-md mt-2"
          >
            Soumettre ma candidature
          </button>
        </form>
      </div>
    </div>
  );
}
