"use client";

import { useState } from "react";
import Link from "next/link";

export default function GuidesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative hidden md:block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors">
        Guides
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div
          className="w-64 rounded-xl ring-1 ring-white/[0.1] overflow-hidden"
          style={{
            background: "rgba(8,8,14,0.95)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
          }}
        >
          <Link
            href="/guide/workers"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.06]"
          >
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-white">For Workers</div>
              <div className="text-[10px] text-white/40">Sign up, QR codes, withdrawals</div>
            </div>
          </Link>
          <Link
            href="/guide/customers"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors"
          >
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-white">For Customers</div>
              <div className="text-[10px] text-white/40">How to tip in 30 seconds</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
