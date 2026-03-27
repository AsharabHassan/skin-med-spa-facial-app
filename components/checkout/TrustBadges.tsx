export default function TrustBadges() {
  return (
    <div className="flex justify-center gap-6 py-2">
      <div className="text-center">
        <span className="text-lg">🔒</span>
        <p className="font-mono text-[8px] text-gray mt-1">SSL Encrypted</p>
      </div>
      <div className="text-center">
        <span className="text-lg">💳</span>
        <p className="font-mono text-[8px] text-gray mt-1">PCI Compliant</p>
      </div>
      <div className="text-center">
        <span className="text-lg leading-none text-teal">✓</span>
        <p className="font-mono text-[8px] text-gray mt-1">Money-Back{"\n"}Guarantee</p>
      </div>
    </div>
  );
}
