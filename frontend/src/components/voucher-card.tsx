"use client";

import { useState } from "react";

export function VoucherCard() {
  const [code, setCode] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h3 className="font-heading font-bold text-foreground text-base">
        Nhập mã ưu đãi
      </h3>
      <p className="text-[13px] text-muted-foreground mt-0.5 mb-3">
        Có mã tặng lượt chấm AI? Nhập để nhận ngay.
      </p>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm h-9 uppercase tracking-wide font-semibold"
            placeholder="NHẬP MÃ"
            spellCheck={false}
            autoCapitalize="characters"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ textTransform: "uppercase" }}
          />
          <button
            className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-md px-3 h-9 shrink-0 bg-[#CC1C01] hover:bg-[#4D0D0D] text-primary-foreground"
            type="button"
            disabled={!code.trim()}
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
