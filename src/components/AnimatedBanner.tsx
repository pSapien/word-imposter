export function Connecting() {
  return (
    <div className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded shadow-lg flex items-center gap-2 animate-pulse z-50">
      <span className="inline-block w-2 h-2 bg-black rounded-full animate-bounce"></span>
      <span className="font-semibold">Connecting…</span>
    </div>
  );
}

export const AnimatedBanner = {
  Connecting,
};
