"use client";
import React, { useEffect, useState, useRef } from "react";
import { Globe, Users, TrendingUp } from "lucide-react";

interface CountryVisit {
  code: string;
  name: string;
  flag: string;
  count: number;
}

interface VisitorData {
  totalVisitors: number;
  countries: CountryVisit[];
}

export default function VisitorCounter() {
  const [data, setData] = useState<VisitorData | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    // 1. Record visitor (once per session)
    if (!tracked.current) {
      tracked.current = true;
      const sessionKey = "visitor_tracked";
      if (!sessionStorage.getItem(sessionKey)) {
        fetch("/api/visitors", { method: "POST" })
          .then(() => sessionStorage.setItem(sessionKey, "1"))
          .catch(() => {});
      }
    }

    // 2. Fetch stats
    fetch("/api/visitors")
      .then(r => r.json())
      .then((res: VisitorData & { success: boolean }) => {
        if (res.success) {
          setData({ totalVisitors: res.totalVisitors, countries: res.countries });
        }
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-center">
        {/* Header */}
        <div className="flex items-center gap-3 md:col-span-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 shrink-0">
            <Globe className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base truncate">Lượt truy cập</h3>
            <p className="text-xs text-slate-500 truncate">Thống kê theo thời gian thực</p>
          </div>
        </div>

        {/* Total counter */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <Users className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap">Tổng lượt truy cập</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                {data.totalVisitors.toLocaleString("vi-VN")}
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-500/50 ml-auto shrink-0" />
          </div>
        </div>

        {/* Country breakdown */}
        {data.countries.length > 0 && (
          <div className="md:col-span-6 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-2">
              Theo quốc gia
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {data.countries.slice(0, 8).map((country) => (
                <div
                  key={country.code}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors group min-w-0"
                >
                  <span className="text-base leading-none flex-shrink-0" title={country.name}>
                    {country.flag}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors truncate flex-1">
                    {country.name}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex-shrink-0">
                    {country.count.toLocaleString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
