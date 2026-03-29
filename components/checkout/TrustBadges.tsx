const BADGES = [
  {
    label: "SSL Encrypted",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <path d="M12 2L4 6v6c0 5.25 3.4 10.15 8 11.5C16.6 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: "PCI Compliant",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8"/>
        <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Satisfaction Guaranteed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function TrustBadges() {
  return (
    <div className="flex justify-around py-2">
      {BADGES.map((b) => (
        <div key={b.label} className="flex flex-col items-center gap-1.5">
          {b.icon}
          <p className="font-mono text-[8px] text-gray-400 text-center leading-tight">{b.label}</p>
        </div>
      ))}
    </div>
  );
}
