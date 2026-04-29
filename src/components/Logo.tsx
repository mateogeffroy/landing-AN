'use client';

export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
          <stop offset="100%" stopColor="#34d399" /> {/* emerald-400 */}
        </linearGradient>
      </defs>
      <path
        d="M18 5H6L12 12L6 19H18"
        stroke="url(#logoGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}