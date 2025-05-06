"use client"

import React, { useState, useEffect } from "react"
import { PlusCircle, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createStudent, deleteStudent, getAvailableClasses, getStudentByEnrollment, getStudents, updateStudent } from "@/app/actions/student"

export default function AlunosPage() {
  const [students, setStudents] = useState<{
    id: string
    enrollment: string
    name: string
    phone: string | null
    classId: string | null
    class?: {
      id: string
      name: string
      year: string
    } | null
  }[]>([])
  
  const [formStudent, setFormStudent] = useState<{
    id: string
    enrollment: string
    name: string
    phone: string | null
    classId: string | null
  }>({ id: "", enrollment: "", name: "", phone: null, classId: null })
  
  const [classes, setClasses] = useState<{
    id: string
    name: string
    year: string
  }[]>([])
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para busca e paginação
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10
  
  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1) // Resetar para primeira página ao buscar
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Efeito para carregar alunos com paginação e busca
  useEffect(() => {
    async function loadStudents() {
      setIsLoading(true)
      const result = await getStudents(debouncedQuery, currentPage, itemsPerPage)
      if (result.success) {
        setStudents(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
        }
      } else {
        toast.error("Erro ao carregar alunos.")
      }
      setIsLoading(false)
    }
    
    loadStudents()
  }, [debouncedQuery, currentPage])

  // Efeito para carregar turmas disponíveis
  useEffect(() => {
    async function loadClasses() {
      const result = await getAvailableClasses();
      if (result.success) {
        setClasses(result.data || []);
      }
    }
    
    loadClasses();
  }, []);

  // Função para lidar com a mudança de página
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const openModal = (student: {
    id: string
    enrollment: string
    name: string
    phone: string | null
    classId: string | null
    class?: {
      id: string
      name: string
      year: string
    } | null
  } | null) => {
    if (student) {
      setFormStudent({
        id: student.id,
        enrollment: student.enrollment,
        name: student.name,
        phone: student.phone,
        classId: student.classId
      })
      setIsEditMode(true)
    } else {
      setFormStudent({ id: "", enrollment: "", name: "", phone: null, classId: null })
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
        phone: formStudent.phone,
        classId: formStudent.classId
      })
      
      if (result.success) {
        // Recarregar os alunos para garantir que temos dados atualizados
        const studentsResult = await getStudents(debouncedQuery, currentPage, itemsPerPage)
        if (studentsResult.success) {
          setStudents(studentsResult.data || [])
          if (studentsResult.pagination) {
            setTotalPages(studentsResult.pagination.totalPages)
            setTotalItems(studentsResult.pagination.total)
          }
        }
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
        phone: formStudent.phone || undefined,
        classId: formStudent.classId || undefined
      })
      
      if (result.success) {
        // Recarregar os alunos para garantir que temos dados atualizados
        const studentsResult = await getStudents(debouncedQuery, currentPage, itemsPerPage)
        if (studentsResult.success) {
          setStudents(studentsResult.data || [])
          if (studentsResult.pagination) {
            setTotalPages(studentsResult.pagination.totalPages)
            setTotalItems(studentsResult.pagination.total)
          }
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
      // Recarregar os alunos para garantir que temos dados atualizados
      const studentsResult = await getStudents(debouncedQuery, currentPage, itemsPerPage)
      if (studentsResult.success) {
        setStudents(studentsResult.data || [])
        if (studentsResult.pagination) {
          setTotalPages(studentsResult.pagination.totalPages)
          setTotalItems(studentsResult.pagination.total)
        }
      }
      toast.success("Aluno apagado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao apagar aluno.")
    }
  }
  
  // Renderizar paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {students.length} de {totalItems} alunos
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNumber: number
            
            // Lógica para mostrar páginas ao redor da atual
            if (totalPages <= 5) {
              pageNumber = i + 1
            } else if (currentPage <= 3) {
              pageNumber = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i
            } else {
              pageNumber = currentPage - 2 + i
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNumber)}
                className="w-8 h-8 p-0"
              >
                {pageNumber}
              </Button>
            )
          })}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
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
                  <div className="space-y-2">
                    <Label htmlFor="class">Turma</Label>
                    <Select 
                      value={formStudent.classId || "none"} 
                      onValueChange={(value) => setFormStudent({ 
                        ...formStudent, 
                        classId: value === "none" ? null : value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem turma</SelectItem>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.year} - {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              {/* Campo de busca */}
              <div className="flex mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou matrícula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando alunos...</p>
              ) : students.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  {debouncedQuery ? "Nenhum aluno encontrado para esta busca." : "Nenhum aluno cadastrado."}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground">
                    <div>Matrícula</div>
                    <div>Nome</div>
                    <div>Telefone</div>
                    <div>Turma</div>
                    <div>Ações</div>
                  </div>
                  <Separator />
                  <div className="max-h-[500px] space-y-2 overflow-auto">
                    {students.map((student) => (
                      <div key={student.id} className="grid grid-cols-5 items-center gap-4 text-sm">
                        <div>{student.enrollment}</div>
                        <div>{student.name}</div>
                        <div>{student.phone || "—"}</div>
                        <div>{student.class ? `${student.class.year} - ${student.class.name}` : "—"}</div>
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
                  
                  {/* Paginação */}
                  {renderPagination()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
