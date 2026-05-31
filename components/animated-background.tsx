export function AnimatedBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-[#080a19]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.20),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.18),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
      <div className="absolute left-[8%] top-[22%] h-44 w-44 rounded-full bg-amber-300/18 blur-3xl animate-float" />
      <div className="absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-cyan-300/14 blur-3xl animate-float [animation-delay:1.5s]" />
      <div className="absolute bottom-[8%] left-[42%] h-56 w-56 rounded-full bg-fuchsia-400/12 blur-3xl animate-float [animation-delay:3s]" />
    </div>
  );
}
