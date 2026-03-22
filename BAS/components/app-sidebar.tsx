"use client";
import * as React from "react";
import { LayoutDashboard, ArrowLeftRight, History, CircuitBoard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard",       icon: LayoutDashboard, code: "01" },
  { title: "History",   url: "/dashboard",       icon: History,         code: "02" },
  { title: "Transfer",  url: "/dashboard",       icon: ArrowLeftRight,  code: "03" },
  { title: "CAU",       url: "/dashboard/cau",   icon: CircuitBoard,    code: "04" },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-white/[0.06] bg-[#080808]">

      {/* Header */}
      <SidebarHeader className="p-5 border-b border-white/[0.06]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <span className="font-mono text-[8px] text-white/50 tracking-[0.35em] uppercase">SYS.NODE_01 · ONLINE</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center border border-primary/30 bg-primary/5">
              <span className="text-primary font-black text-base font-mono">B</span>
              <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/60" />
              <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/60" />
              <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />
            </div>
            <div>
              <p className="font-mono text-sm font-black tracking-[0.12em] text-white uppercase">BANKAPP</p>
              <p className="font-mono text-[8px] text-white/45 tracking-widest">v2.4.1 // ACTIVE</p>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-3 py-5">
        <p className="font-mono text-[8px] text-white/45 tracking-[0.4em] uppercase px-3 mb-4">// NAV</p>
        <SidebarMenu className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.title === "Dashboard";
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={`h-11 px-3 rounded-none transition-all duration-150 border-l-2 ${
                    isActive
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-transparent text-white/55 hover:text-white/60 hover:bg-white/[0.03] hover:border-white/10"
                  }`}
                >
                  <a href={item.url} className="flex items-center gap-3 text-inherit">
                    <span className="font-mono text-[8px] opacity-40 w-4">{item.code}</span>
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono font-bold text-[11px] tracking-[0.15em] uppercase">{item.title}</span>
                    {isActive && (
                      <span className="ml-auto font-mono text-[8px] text-primary/50">●</span>
                    )}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Decorative dot grid */}
        <div className="mt-8 px-3">
          <div className="grid grid-cols-8 gap-1.5 opacity-[0.06]">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white" />
            ))}
          </div>
        </div>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-white/[0.06]">
        <div className="relative flex items-center gap-3 border border-white/[0.06] bg-white/[0.02] p-3">
          <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/30" />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/30" />
          <div className="h-8 w-8 shrink-0 border border-primary/30 bg-primary/8 flex items-center justify-center">
            <span className="font-mono font-black text-primary text-[10px]">JD</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[11px] font-black text-white truncate tracking-[0.1em] uppercase">John Doe</span>
            <span className="font-mono text-[8px] text-white/50 uppercase tracking-widest truncate">TIER_A</span>
          </div>
        </div>
      </SidebarFooter>

    </Sidebar>
  );
}
