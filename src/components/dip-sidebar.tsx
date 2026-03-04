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
  CircleDashed,
  PlusCircle,
  ZapOff
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
    label: "Point Transformations",
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
      { title: "Hist Stretching", id: "hist_stretch", icon: BarChart3, shortcut: "H" },
      { title: "Piecewise Linear", id: "piecewise", icon: Layers, shortcut: "W" },
      { title: "Hist Equalization", id: "hist_eq", icon: BarChart3, shortcut: "E" },
    ]
  },
  {
    label: "Spatial Filtering",
    items: [
      { title: "Box Blur", id: "box_blur", icon: Box, shortcut: "B" },
      { title: "Gaussian Blur", id: "gauss_blur", icon: Wind, shortcut: "G" },
      { title: "Laplacian Filter", id: "laplacian", icon: Focus, shortcut: "A" },
      { title: "Sobel Operator", id: "sobel", icon: Scissors, shortcut: "D" },
    ]
  },
  {
    label: "Frequency LPF",
    items: [
      { title: "Ideal LPF", id: "ideal_lpf", icon: Waves, shortcut: "1" },
      { title: "Butterworth LPF", id: "butter_lpf", icon: Waves, shortcut: "2" },
      { title: "Gaussian LPF", id: "gauss_lpf", icon: Waves, shortcut: "3" },
    ]
  },
  {
    label: "Frequency HPF",
    items: [
      { title: "Ideal HPF", id: "ideal_hpf", icon: Zap, shortcut: "4" },
      { title: "Butterworth HPF", id: "butter_hpf", icon: Zap, shortcut: "5" },
      { title: "Gaussian HPF", id: "gauss_hpf", icon: Zap, shortcut: "6" },
    ]
  },
  {
    label: "Restoration: Order",
    items: [
      { title: "Median Filter", id: "median", icon: Trash2, shortcut: "M" },
      { title: "Max Filter", id: "max", icon: PlusCircle, shortcut: "X" },
      { title: "Min Filter", id: "min", icon: MinusCircle, shortcut: "I" },
    ]
  }
]

interface DIPSidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
}

export function DIPSidebar({ activeModule, setActiveModule }: DIPSidebarProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Sidebar variant="inset" className="border-r border-white/[0.05] bg-[#08090a]">
      <SidebarHeader className="h-16 flex flex-row items-center gap-3 px-6">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.4)]">
          <Binary className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-sm text-white">AetherDIP</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-nowrap">Academic Engine</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <div className="px-4 py-4">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/50 group-focus-within:text-emerald-500 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search modules..."
              className="h-9 w-full rounded-md border border-white/[0.05] bg-white/[0.02] pl-8 pr-12 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.04] transition-all"
            />
            <div className="absolute right-2 top-2.5 flex items-center gap-0.5 rounded border border-white/[0.1] bg-white/[0.05] px-1.5 font-mono text-[10px] text-muted-foreground/50 pointer-events-none">
              <Command className="size-2" />K
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
                      isActive={activeModule === item.id}
                      className={`
                        px-4 py-5 rounded-md transition-all duration-200
                        ${activeModule === item.id 
                          ? "bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" 
                          : "text-muted-foreground hover:bg-white/[0.02] hover:text-white"
                        }
                      `}
                    >
                      <item.icon className={`size-3.5 ${activeModule === item.id ? "text-emerald-400" : "opacity-40"}`} />
                      <span className="font-medium text-[13px] text-nowrap">{item.title}</span>
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
