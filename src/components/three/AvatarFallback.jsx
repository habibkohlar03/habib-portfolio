// Lightweight, no-WebGL stand-in: a soft silhouette on a platform.
// Used for reduced-motion, data-saver, no-WebGL devices, and while the 3D scene loads.
export default function AvatarFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <svg viewBox="0 0 240 360" className="h-[78%] w-auto" fill="none">
        <defs>
          <radialGradient id="fb-glow" cx="50%" cy="85%" r="55%">
            <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fb-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9d4cf" />
            <stop offset="100%" stopColor="#b9b3ad" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="320" rx="105" ry="36" fill="url(#fb-glow)" />
        <ellipse cx="120" cy="324" rx="78" ry="16" stroke="#ff6a00" strokeOpacity="0.7" />
        <ellipse cx="120" cy="324" rx="108" ry="24" stroke="#ff6a00" strokeOpacity="0.2" />
        <circle cx="120" cy="74" r="27" fill="url(#fb-body)" stroke="#ff6a00" strokeOpacity="0.35" />
        <rect x="111" y="98" width="18" height="16" rx="6" fill="url(#fb-body)" />
        <path
          d="M78 124c0-9 7-14 16-14h52c9 0 16 5 16 14l8 92c1 7-4 12-10 12h-9l-4 88c0 6-4 10-10 10s-10-4-10-10l-4-60h-6l-4 60c0 6-4 10-10 10s-10-4-10-10l-4-88h-9c-6 0-11-5-10-12l8-92z"
          fill="url(#fb-body)"
          stroke="#ff6a00"
          strokeOpacity="0.35"
        />
      </svg>
    </div>
  );
}
