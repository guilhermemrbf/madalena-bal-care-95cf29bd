const PharmacyLogoSVG = ({ width = 190 }: { width?: number }) => (
  <svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" style={{ width, height: 'auto', display: 'block', margin: '0 auto' }}>
    <rect x="2" y="2" width="196" height="106" rx="10" fill="white" stroke="#1a6b3c" strokeWidth="2"/>
    <rect x="18" y="22" width="52" height="16" rx="3" fill="#1a6b3c"/>
    <rect x="29" y="11" width="16" height="52" rx="3" fill="#1a6b3c"/>
    <rect x="20" y="24" width="48" height="12" rx="2" fill="#6aaa2a"/>
    <rect x="31" y="13" width="12" height="48" rx="2" fill="#6aaa2a"/>
    <path d="M 22 55 Q 37 30 55 28 Q 65 27 68 35" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <circle cx="37" cy="24" r="3" fill="white"/>
    <ellipse cx="44" cy="9" rx="4" ry="8" fill="#6aaa2a" transform="rotate(-15 44 9)"/>
    <ellipse cx="52" cy="7" rx="3" ry="7" fill="#1a6b3c" transform="rotate(10 52 7)"/>
    <ellipse cx="36" cy="8" rx="3" ry="6" fill="#8aca3a" transform="rotate(-35 36 8)"/>
    <ellipse cx="58" cy="11" rx="2.5" ry="5" fill="#6aaa2a" transform="rotate(25 58 11)"/>
    <ellipse cx="37" cy="67" rx="10" ry="4" fill="#8B6914" opacity="0.85"/>
    <path d="M 29 67 Q 30 58 37 56 Q 44 58 45 67" fill="#A0791A" opacity="0.9"/>
    <ellipse cx="37" cy="56" rx="8" ry="3" fill="#C49A2A" opacity="0.8"/>
    <line x1="37" y1="56" x2="42" y2="46" stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/>
    <path d="M 80 55 Q 95 45 105 50" stroke="#6aaa2a" strokeWidth="1.5" fill="none"/>
    <ellipse cx="90" cy="46" rx="6" ry="10" fill="#6aaa2a" transform="rotate(-40 90 46)" opacity="0.9"/>
    <ellipse cx="100" cy="43" rx="5" ry="9" fill="#1a6b3c" transform="rotate(-15 100 43)" opacity="0.9"/>
    <ellipse cx="108" cy="47" rx="4" ry="8" fill="#8aca3a" transform="rotate(15 108 47)" opacity="0.85"/>
    <rect x="112" y="54" width="18" height="8" rx="4" fill="#6aaa2a" transform="rotate(-35 121 58)"/>
    <rect x="112" y="54" width="9" height="8" rx="4" fill="#1a6b3c" transform="rotate(-35 121 58)"/>
    <rect x="68" y="58" width="118" height="36" rx="6" fill="white" stroke="#6aaa2a" strokeWidth="1.5"/>
    <text x="127" y="73" fontFamily="Georgia, serif" fontSize="11" fontWeight="bold" fill="#1a6b3c" textAnchor="middle" letterSpacing="1">MADALENA BAL</text>
    <text x="127" y="87" fontFamily="Georgia, serif" fontSize="10" fontWeight="bold" fill="#1a6b3c" textAnchor="middle" letterSpacing="2">FARMÁCIA</text>
  </svg>
);

export default PharmacyLogoSVG;
