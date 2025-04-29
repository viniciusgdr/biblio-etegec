"use client"

import * as React from "react"
import {
  BookOpen,
  Users,
  BookMarked,
  Home,
  LogOut,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'

// Dados do sistema de biblioteca
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Livros",
      url: "/dashboard/livros",
      icon: BookOpen
    },
    {
      title: "Alunos",
      url: "/dashboard/alunos",
      icon: Users
    },
    {
      title: "Empréstimos",
      url: "/dashboard/emprestimos",
      icon: BookMarked
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const { setTheme, theme } = useTheme()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <BookOpen className="h-6 w-6" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold">Tema</span>
          <select
            className="border border-gray-300 rounded-md p-1"
            onChange={(e) => setTheme(e.target.value)}
            value={theme}
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </div>
        <NavUser user={{ 
          name: session?.user!.name || "",
          email: session?.user!.email || "",
         }} />
        <button className="flex w-full items-center gap-2 p-2 text-sm text-muted-foreground hover:text-primary" onClick={() => {
          signOut({redirectTo: "/auth/signin"})
        }}>
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
