"use client"

import * as React from "react"
import { 
  MinusCircle, 
  Settings2, 
  Zap, 
  ChevronRight,
  Binary,
  Command,
  Search
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const transformations = [
  {
    title: "Negative",
    id: "negative",
    icon: MinusCircle,
    shortcut: "N",
  },
  {
    title: "Log Transform",
    id: "log",
    icon: Settings2,
    shortcut: "L",
  },
  {
    title: "Power Law",
    id: "power",
    icon: Zap,
    shortcut: "P",
  },
  {
    title: "Contrast Stretch",
    id: "contrast",
    icon: Settings2,
    shortcut: "C",
  },
  {
    title: "Thresholding",
    id: "threshold",
    icon: MinusCircle,
    shortcut: "T",
  },
  {
    title: "Piecewise Linear",
    id: "piecewise",
    icon: Zap,
    shortcut: "W",
  },
]

interface DIPSidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
}

export function DIPSidebar({ activeModule, setActiveModule }: DIPSidebarProps) {
  return (
    <Sidebar variant="inset" className="border-r border-white/[0.05] bg-[#08090a]">
      <SidebarHeader className="h-16 flex flex-row items-center gap-3 px-6">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.4)]">
          <Binary className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-sm text-white">AetherDIP</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Workspace</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <div className="px-4 py-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/50" />
            <div className="h-9 w-full rounded-md border border-white/[0.05] bg-white/[0.02] pl-8 flex items-center text-xs text-muted-foreground/50 select-none cursor-default">
              Search modules...
              <div className="ml-auto mr-1 flex items-center gap-0.5 rounded border border-white/[0.1] bg-white/[0.05] px-1.5 font-mono text-[10px]">
                <Command className="size-2" />K
              </div>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 py-4">
            Transformations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {transformations.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => setActiveModule(item.id)}
                    isActive={activeModule === item.id}
                    className={`
                      px-4 py-6 rounded-lg transition-all duration-200
                      ${activeModule === item.id 
                        ? "bg-white/[0.05] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" 
                        : "text-muted-foreground hover:bg-white/[0.02] hover:text-white"
                      }
                    `}
                  >
                    <item.icon className={`size-4 ${activeModule === item.id ? "text-emerald-400" : "opacity-70"}`} />
                    <span className="font-medium text-sm">{item.title}</span>
                    <span className="ml-auto text-[10px] font-mono opacity-30">{item.shortcut}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
