import { useId } from "react";

function VeloraMark({ className = "", decorative = false }) {
  const id = useId();
  const purpleId = `${id}-purple`;
  const violetId = `${id}-violet`;
  const blueId = `${id}-blue`;
  const tealId = `${id}-teal`;

  return (
    <svg
      className={className}
      viewBox="0 0 176 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : "Velora logo"}
    >
      <defs>
        <linearGradient id={purpleId} x1="26" y1="40" x2="91" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D934FF" />
          <stop offset="0.48" stopColor="#962EF2" />
          <stop offset="1" stopColor="#4B2BD7" />
        </linearGradient>
        <linearGradient id={violetId} x1="54" y1="74" x2="124" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2747D6" />
          <stop offset="1" stopColor="#1E79EA" />
        </linearGradient>
        <linearGradient id={blueId} x1="56" y1="71" x2="138" y2="43" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1C49D8" />
          <stop offset="0.55" stopColor="#209BE8" />
          <stop offset="1" stopColor="#3CE6E2" />
        </linearGradient>
        <linearGradient id={tealId} x1="82" y1="88" x2="158" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#12AEB2" />
          <stop offset="0.5" stopColor="#36D5C4" />
          <stop offset="1" stopColor="#7AF6BF" />
        </linearGradient>
      </defs>

      <path
        d="M33 42C54 37 72 40 90 59C76 62 65 72 57 89C51 74 43 58 33 42Z"
        fill={`url(#${purpleId})`}
      />
      <path
        d="M54 74C72 62 101 52 129 39C118 54 97 74 76 94C70 86 63 79 54 74Z"
        fill={`url(#${violetId})`}
      />
      <path
        d="M58 76C83 61 118 50 150 29C140 49 117 73 83 96C77 89 68 82 58 76Z"
        fill={`url(#${blueId})`}
      />
      <path
        d="M73 85C98 66 135 54 161 23C157 53 137 95 99 121C94 106 85 94 73 85Z"
        fill={`url(#${tealId})`}
      />

      <circle cx="139" cy="13" r="4.4" fill="#56E2DE" />
      <circle cx="151" cy="25" r="6.2" fill="#46DDD4" />
      <circle cx="132" cy="31" r="7.4" fill="#43D6CF" />
      <circle cx="138" cy="24" r="3.1" fill="#61EAE2" />
    </svg>
  );
}

function VeloraLogo({ variant = "sidebar", subtitle = "" }) {
  return (
    <div className={`velora-logo velora-logo-${variant}`}>
      <VeloraMark className={`velora-mark velora-mark-${variant}`} decorative />
      <div className="velora-logo-copy">
        <div className="velora-logo-line">
          <span className="velora-logo-name">Velora</span>
          <span className="velora-logo-product">CRM</span>
        </div>
        {subtitle ? <span className="velora-logo-subtitle">{subtitle}</span> : null}
      </div>
    </div>
  );
}

export default VeloraLogo;
