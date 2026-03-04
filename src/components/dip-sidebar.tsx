"use client"

import * as React from "react"
import { 
  MinusCircle, 
  Settings2, 
  Zap, 
  Binary,
  Command,
  Search,
  BarChart3,
  Layers,
  SlidersHorizontal,
  Box,
  Wind,
  Focus,
  Activity,
  Trash2,
  Scissors,
  Waves,
  ZapOff,
  CircleDashed
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

const categories = [
  {
    label: "Intensity Transforms",
    items: [
      { title: "Negative", id: "negative", icon: MinusCircle, shortcut: "N" },
      { title: "Log Transform", id: "log", icon: Settings2, shortcut: "L" },
      { title: "Power Law", id: "power", icon: Zap, shortcut: "P" },
      { title: "Thresholding", id: "threshold", icon: CircleDashed, shortcut: "T" },
    ]
  },
  {
    label: "Linear & Histogram",
    items: [
      { title: "Contrast Stretch", id: "contrast", icon: SlidersHorizontal, shortcut: "C" },
      { title: "Piecewise Linear", id: "piecewise", icon: Layers, shortcut: "W" },
      { title: "Hist Equalization", id: "hist_eq", icon: BarChart3, shortcut: "E" },
    ]
  },
  {
    label: "Spatial Filtering",
    items: [
      { title: "Box Blur", id: "box_blur", icon: Box, shortcut: "B" },
      { title: "Gaussian Blur", id: "gauss_blur", icon: Wind, shortcut: "G" },
      { title: "Laplacian", id: "laplacian", icon: Focus, shortcut: "A" },
      { title: "Sobel", id: "sobel", icon: Scissors, shortcut: "D" },
    ]
  },
  {
    label: "Frequency Domain",
    items: [
      { title: "Lowpass Filters", id: "ideal_lpf", icon: Waves, shortcut: "1" },
      { title: "Highpass Filters", id: "ideal_hpf", icon: Zap, shortcut: "2" },
    ]
  },
  {
    label: "Restoration",
    items: [
      { title: "Median Filter", id: "median", icon: Trash2, shortcut: "M" },
      { title: "Max / Min Filter", id: "max", icon: ZapOff, shortcut: "X" },
    ]
  }
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

        {categories.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel className="px-4 text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/30 py-4">
              {category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => setActiveModule(item.id)}
                      isActive={activeModule === item.id || (item.id === 'ideal_lpf' && activeModule.includes('_lpf')) || (item.id === 'ideal_hpf' && activeModule.includes('_hpf'))}
                      className={`
                        px-4 py-5 rounded-md transition-all duration-200
                        ${(activeModule === item.id || (item.id === 'ideal_lpf' && activeModule.includes('_lpf')) || (item.id === 'ideal_hpf' && activeModule.includes('_hpf')))
                          ? "bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" 
                          : "text-muted-foreground hover:bg-white/[0.02] hover:text-white"
                        }
                      `}
                    >
                      <item.icon className={`size-3.5 ${(activeModule === item.id || (item.id === 'ideal_lpf' && activeModule.includes('_lpf')) || (item.id === 'ideal_hpf' && activeModule.includes('_hpf'))) ? "text-emerald-400" : "opacity-40"}`} />
                      <span className="font-medium text-[13px]">{item.title}</span>
                      <span className="ml-auto text-[9px] font-mono opacity-20">{item.shortcut}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
