"use client"

import React, { useState, useEffect } from "react"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { createStudent, deleteStudent, getStudentByEnrollment, getStudents, updateStudent } from "@/app/actions/student"

export default function AlunosPage() {
  const [students, setStudents] = useState<{
    id: string
    enrollment: string
    name: string
    phone: string | null
  }[]>([])
  const [formStudent, setFormStudent] = useState<{
    id: string
    enrollment: string
    name: string
    phone: string | null
  }>({ id: "", enrollment: "", name: "" , phone: null })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadStudents() {
      setIsLoading(true)
      const result = await getStudents()
      if (result.success) {
        setStudents(result.data || [])
      } else {
        toast.error("Erro ao carregar alunos.")
      }
      setIsLoading(false)
    }
    
    loadStudents()
  }, [])

  const openModal = (student: {
    id: string
    enrollment: string
    name: string
    phone: string | null
  } | null) => {
    if (student) {
      setFormStudent(student)
      setIsEditMode(true)
    } else {
      setFormStudent({ id: "", enrollment: "", name: "", phone: "" })
      setIsEditMode(false)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleCreateOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formStudent.enrollment || !formStudent.name) {
      toast.error("Preencha pelo menos a matrícula e o nome do aluno!")
      return
    }
    
    if (isEditMode) {
      const result = await updateStudent(formStudent.id, { 
        name: formStudent.name, 
        phone: formStudent.phone 
      })
      
      if (result.success) {
        setStudents(students.map(s => s.id === formStudent.id && result.data ? result.data : s))
        toast.success("Aluno atualizado com sucesso!")
        closeModal()
      } else {
        toast.error(result.error || "Erro ao atualizar aluno.")
      }
    } else {
      // Check if enrollment already exists
      const checkResult = await getStudentByEnrollment(formStudent.enrollment)
      if (checkResult.data) {
        toast.error("Já existe um aluno com esta matrícula.")
        return
      }

      const result = await createStudent({
        enrollment: formStudent.enrollment,
        name: formStudent.name,
        phone: formStudent.phone || undefined
      })
      
      if (result.success) {
        if (result.data) {
          setStudents([...students, result.data])
        }
        toast.success("Aluno cadastrado com sucesso!")
        closeModal()
      } else {
        toast.error(result.error || "Erro ao cadastrar aluno.")
      }
    }
  }

  const handleDeleteStudent = async (id: string) => {
    const result = await deleteStudent(id)
    
    if (result.success) {
      setStudents(students.filter(student => student.id !== id))
      toast.error("Aluno apagado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao apagar aluno.")
    }
  }

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Alunos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Gerenciamento de Alunos</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openModal(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Aluno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Editar Aluno" : "Cadastrar Aluno"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrUpdateStudent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enrollment">Matrícula</Label>
                    <Input 
                      id="enrollment"
                      placeholder="Digite a matrícula"
                      value={formStudent.enrollment}
                      onChange={(e) => setFormStudent({ ...formStudent, enrollment: e.target.value })}
                      disabled={isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name"
                      placeholder="Digite o nome completo"
                      value={formStudent.name}
                      onChange={(e) => setFormStudent({ ...formStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone"
                      placeholder="Digite o telefone de contato"
                      value={formStudent.phone || ""}
                      onChange={(e) => setFormStudent({ ...formStudent, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">
                      {isEditMode ? "Salvar alterações" : "Cadastrar Aluno"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Alunos Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando alunos...</p>
              ) : students.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum aluno cadastrado.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
                    <div>Matrícula</div>
                    <div>Nome</div>
                    <div>Telefone</div>
                    <div>Ações</div>
                  </div>
                  <Separator />
                  <div className="max-h-[500px] space-y-2 overflow-auto">
                    {students.map((student) => (
                      <div key={student.id} className="grid grid-cols-4 items-center gap-4 text-sm">
                        <div>{student.enrollment}</div>
                        <div>{student.name}</div>
                        <div>{student.phone || "—"}</div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openModal(student)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteStudent(student.id)}
                            title="Apagar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
