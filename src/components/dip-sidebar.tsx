"use client"

import * as React from "react"
import { 
  MinusCircle, 
  Settings2, 
  Zap, 
  Image as ImageIcon,
  ChevronRight,
  Code2,
  Binary
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
  },
  {
    title: "Log Transformation",
    id: "log",
    icon: Settings2,
  },
  {
    title: "Power Law (Gamma)",
    id: "power",
    icon: Zap,
  },
]

interface DIPSidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
}

export function DIPSidebar({ activeModule, setActiveModule }: DIPSidebarProps) {
  return (
    <Sidebar variant="inset" className="border-r border-border/50">
      <SidebarHeader className="flex flex-row items-center gap-2 px-4 py-6">
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Binary className="size-5" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-semibold tracking-tight text-lg">AetherDIP</span>
          <span className="text-xs text-muted-foreground">Syllabus Companion</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            Basic Transformations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transformations.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    onClick={() => setActiveModule(item.id)}
                    isActive={activeModule === item.id}
                    className="px-4 py-5"
                  >
                    <item.icon className="size-4" />
                    <span className="font-medium">{item.title}</span>
                    <ChevronRight className="ml-auto size-3 opacity-50" />
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
