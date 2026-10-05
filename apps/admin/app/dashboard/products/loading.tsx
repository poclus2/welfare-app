export default function Loading() {
  return (
    <div className="p-5 lg:p-8 space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-[#EDE0E0]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#F5F0EB]" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-[#F5F0EB]" />
        ))}
      </div>
    </div>
  );
}
