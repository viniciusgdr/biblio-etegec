/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from "react"
import { BookOpen, Users, BookMarked, History } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getDashboardStats } from "../actions/dashboard"

export default function Page() {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true)
        const result = await getDashboardStats()
        if (result.success) {
          setStats(result.data)
        } else {
          toast.error("Erro ao carregar estatísticas")
        }
      } catch (error) {
        console.error("Failed to load stats:", error)
        toast.error("Erro ao carregar dados do dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h1 className="text-3xl font-bold">Sistema de Biblioteca</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao sistema de gerenciamento da biblioteca ETEGEC.
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, idx) => (
                <Card key={idx}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      <div className="h-4 w-24 animate-pulse bg-gray-200 rounded"/>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-6 w-12 animate-pulse bg-gray-200 rounded mb-1"/>
                    <div className="h-3 w-32 animate-pulse bg-gray-200 rounded"/>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Livros
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalBooks || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.availableBooks || 0} disponíveis, {stats?.loanedBooks || 0} emprestados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alunos Cadastrados
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.studentsWithActiveLoans || 0} com empréstimos ativos
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Empréstimos Ativos
                  </CardTitle>
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeLoans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.lateLoans || 0} com devolução atrasada
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Empréstimos
                  </CardTitle>
                  <History className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalLoans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    No último mês: {stats?.loansThisMonth || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Últimos Empréstimos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="h-6 animate-pulse bg-gray-200 rounded"/>
                    ))}
                  </div>
                ) : stats?.recentLoans?.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhum empréstimo registrado.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
                      <div>Livro</div>
                      <div>Aluno</div>
                      <div>Data</div>
                      <div>Status</div>
                    </div>
                    <Separator />
                    {stats?.recentLoans?.map((loan: any) => (
                      <div key={loan.id} className="grid grid-cols-4 gap-4 text-sm">
                        <div>{loan.book.title}</div>
                        <div>{loan.student.name}</div>
                        <div>{format(new Date(loan.loanDate), "dd/MM/yyyy", { locale: ptBR })}</div>
                        <div className="flex items-center">
                          <span className={`flex h-2 w-2 rounded-full ${loan.returned ? 'bg-blue-500' : 'bg-green-500'}`} />
                          <span className="ml-2">{loan.returned ? 'Devolvido' : 'Ativo'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Livros Mais Emprestados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, idx) => (
                      <div key={idx} className="h-6 animate-pulse bg-gray-200 rounded"/>
                    ))}
                  </div>
                ) : stats?.popularBooks?.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhum livro emprestado ainda.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                      <div>Título</div>
                      <div>Autor</div>
                      <div>Empréstimos</div>
                    </div>
                    <Separator />
                    {stats?.popularBooks?.map((book: any) => (
                      <div key={book.id} className="grid grid-cols-3 gap-4 text-sm">
                        <div>{book.title}</div>
                        <div>{book.author}</div>
                        <div>{book._count.loans}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
