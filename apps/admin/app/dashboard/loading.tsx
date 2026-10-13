// Shown at once on every dashboard click while the server loads the page (the pages wait for the API
// before rendering: without this the screen stayed frozen for several seconds). Pages with their own
// loading.tsx (products) keep theirs.
export default function Loading() {
  return (
    <div className="p-5 lg:p-8 space-y-6 animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-[#EDE0E0]" />
        <div className="h-4 w-72 rounded-lg bg-[#F5F0EB]" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#F5F0EB]" />
        ))}
      </div>
      <div className="rounded-2xl border border-[#EDE0E0] bg-white p-5 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-[#F5F0EB]" />
        ))}
      </div>
    </div>
  );
}
