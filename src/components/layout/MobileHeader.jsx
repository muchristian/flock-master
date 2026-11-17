// Mobile top bar with hamburger to toggle the sidebar.
export default function MobileHeader({ onToggleMenu }) {
  return (
    <header className="md:hidden bg-rail border-b border-rail-border text-white px-4 py-3 flex justify-between items-center z-20">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-500 to-accent-500 p-2 rounded-lg text-white">
          <i className="fa-solid fa-kiwi-bird text-lg" />
        </div>
        <span className="font-bold text-lg tracking-tight">FlockMaster</span>
      </div>
      <button
        onClick={onToggleMenu}
        className="text-white hover:text-emerald-300 focus:outline-none p-1.5 rounded-lg"
        aria-label="Toggle navigation"
      >
        <i className="fa-solid fa-bars text-xl" />
      </button>
    </header>
  );
}
