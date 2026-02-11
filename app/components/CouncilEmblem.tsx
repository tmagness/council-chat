'use client';

export default function CouncilEmblem() {
  return (
    <div className="council-emblem relative w-32 h-32 mx-auto mb-6">
      {/* Outer hexagonal ring */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full absolute inset-0 animate-emblem-pulse"
      >
        {/* Outer glow ring */}
        <polygon
          points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
          fill="none"
          stroke="url(#emblemGradient)"
          strokeWidth="1"
          className="drop-shadow-emblem"
        />

        {/* Inner hexagon */}
        <polygon
          points="50,15 83,32.5 83,67.5 50,85 17,67.5 17,32.5"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* Circuit lines radiating outward */}
        <g stroke="#00d4ff" strokeWidth="0.5" opacity="0.4">
          {/* Top */}
          <line x1="50" y1="15" x2="50" y2="5" />
          <line x1="50" y1="0" x2="50" y2="3" />

          {/* Top right */}
          <line x1="83" y1="32.5" x2="93" y2="27.5" />
          <line x1="96" y1="25" x2="93" y2="27" />

          {/* Bottom right */}
          <line x1="83" y1="67.5" x2="93" y2="72.5" />
          <line x1="96" y1="75" x2="93" y2="73" />

          {/* Bottom */}
          <line x1="50" y1="85" x2="50" y2="95" />
          <line x1="50" y1="97" x2="50" y2="100" />

          {/* Bottom left */}
          <line x1="17" y1="67.5" x2="7" y2="72.5" />
          <line x1="4" y1="75" x2="7" y2="73" />

          {/* Top left */}
          <line x1="17" y1="32.5" x2="7" y2="27.5" />
          <line x1="4" y1="25" x2="7" y2="27" />
        </g>

        {/* Corner accents */}
        <g fill="#00d4ff" opacity="0.6">
          <circle cx="50" cy="5" r="1.5" />
          <circle cx="93" cy="27.5" r="1.5" />
          <circle cx="93" cy="72.5" r="1.5" />
          <circle cx="50" cy="95" r="1.5" />
          <circle cx="7" cy="72.5" r="1.5" />
          <circle cx="7" cy="27.5" r="1.5" />
        </g>

        {/* Center "AI" text */}
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fill="#00d4ff"
          fontSize="18"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="bold"
          className="drop-shadow-emblem-text"
        >
          AI
        </text>

        {/* Gradient definition */}
        <defs>
          <linearGradient id="emblemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#0a84ff" />
            <stop offset="100%" stopColor="#00d4ff" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-accent-blue/10 blur-xl animate-emblem-glow" />
      </div>
    </div>
  );
}
