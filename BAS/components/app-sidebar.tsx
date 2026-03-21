"use client";
import * as React from "react";
import { LayoutDashboard, ArrowLeftRight, History, Wallet, CreditCard } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", url: "/dashboard", icon: History },
  { title: "Transfer", url: "/dashboard", icon: ArrowLeftRight },
  { title: "Accounts", url: "/dashboard", icon: Wallet },
  { title: "Cards", url: "/dashboard", icon: CreditCard },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-white/5 bg-black">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-[0_0_15px_rgba(255,105,180,0.5)]">
            <span className="text-black font-black text-xl">B</span>
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase">BANKAPP</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-4">
        <SidebarMenu className="space-y-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild className={"h-14 rounded-2xl px-6 transition-all duration-200 " + (item.title === "Dashboard" ? "bg-primary text-black hover:bg-primary/90 shadow-[0_4px_20px_rgba(255,105,180,0.3)]" : "text-white/60 hover:text-white hover:bg-white/5")}>
                <a href={item.url} className="flex items-center gap-4 text-inherit">
                  <item.icon className="h-5 w-5" />
                  <span className="font-bold text-sm">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-3xl bg-white/5 p-4 border border-white/5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary flex items-center justify-center border border-white/10 overflow-hidden">
             <span className="font-bold text-black text-xs">JD</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-white truncate">John Doe</span>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter truncate">Premium Member</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
