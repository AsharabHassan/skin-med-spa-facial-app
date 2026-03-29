"use client";

import { FacialPricing } from "@/lib/types";
import { calcTax, calcTotal, formatCents } from "@/lib/pricing";

interface Props {
  facial: FacialPricing;
  isMembership?: boolean;
}

export default function OrderSummary({ facial, isMembership = false }: Props) {
  const tax = calcTax(facial.price);
  const total = calcTotal(facial.price);

  if (isMembership) {
    return (
      <div className="space-y-3">
        <p className="label-xs">Order Summary</p>
        <div className="bg-teal/5 rounded-xl p-4 border border-teal/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-[9px] tracking-wider text-teal font-semibold">★ MEMBERSHIP</p>
              <p className="font-heading text-[15px] font-semibold text-dark mt-1">{facial.facialName}</p>
              <p className="font-mono text-[10px] text-gray mt-0.5">Billed monthly · cancel anytime</p>
            </div>
          </div>
          <div className="h-px bg-teal/10 my-3" />
          <div className="space-y-1.5">
            {[
              "Monthly facial of your choice",
              "Priority booking & scheduling",
              "Exclusive member-only pricing",
              "Skincare product discounts",
              "Access to all facials incl. Ultimate Bacial",
            ].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <span className="text-teal text-[10px]">✓</span>
                <span className="font-mono text-[10px] text-dark/60">{b}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-teal/10 my-3" />
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-dark/60">Membership (first month)</span>
              <span className="font-mono text-[13px] font-semibold text-dark">{formatCents(facial.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[11px] text-dark/60">Tax (8.25%)</span>
              <span className="font-mono text-[13px] text-dark">{formatCents(tax)}</span>
            </div>
            <div className="h-px bg-teal/10 my-1" />
            <div className="flex justify-between">
              <span className="font-mono text-[13px] font-bold text-dark">Total Today</span>
              <span className="font-heading text-[18px] font-bold text-teal">{formatCents(total)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="label-xs">Order Summary</p>
      <div className="bg-blush/50 rounded-xl p-4 border border-pink/10">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-mono text-[9px] tracking-wider text-pink font-semibold">★ YOUR BEST MATCH</p>
            <p className="font-heading text-[15px] font-semibold text-dark mt-1">{facial.facialName}</p>
            <p className="font-mono text-[10px] text-gray mt-0.5">~{facial.duration}</p>
          </div>
        </div>
        <div className="h-px bg-pink/10 my-3" />
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-dark/60">Facial Treatment</span>
            <span className="font-mono text-[13px] font-semibold text-dark">{formatCents(facial.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[11px] text-dark/60">Tax (8.25%)</span>
            <span className="font-mono text-[13px] text-dark">{formatCents(tax)}</span>
          </div>
          <div className="h-px bg-pink/10 my-1" />
          <div className="flex justify-between">
            <span className="font-mono text-[13px] font-bold text-dark">Total</span>
            <span className="font-heading text-[18px] font-bold text-pink">{formatCents(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
