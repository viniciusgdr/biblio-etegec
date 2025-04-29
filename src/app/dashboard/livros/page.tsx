/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from "react"
import { PlusCircle, Pencil, Trash2, BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { createBook, deleteBook, getBookByIsbn, getBooks, updateBook } from "@/app/actions/book"
import { cancelLoan, getActiveBookLoans, returnLoan } from "@/app/actions/loan"

export default function LivrosPage() {
  const [books, setBooks] = useState<{
    id: string
    isbn: string
    title: string
    author: string
    year: string
    quantity: number
    available: number
  }[]>([])
  const [formBook, setFormBook] = useState<{
    id: string
    isbn: string
    title: string
    author: string
    year: string
    quantity: number
  }>({ id: "", isbn: "", title: "", author: "", year: "", quantity: 1 })
  const [isEditMode, setIsEditMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Estado para o modal de empréstimos
  const [selectedBookForLoans, setSelectedBookForLoans] = useState<any>(null)
  const [bookLoans, setBookLoans] = useState<any[]>([])
  const [isLoansModalOpen, setIsLoansModalOpen] = useState(false)
  const [isLoadingLoans, setIsLoadingLoans] = useState(false)
  
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
  
  // Efeito para carregar livros com paginação e busca
  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true)
      const result = await getBooks(debouncedQuery, currentPage, itemsPerPage)
      if (result.success) {
        setBooks(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
        }
      } else {
        toast.error("Erro ao carregar livros.")
      }
      setIsLoading(false)
    }
    
    loadBooks()
  }, [debouncedQuery, currentPage])

  // Função para lidar com a mudança de página
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const openModal = (book: {
    id: string
    isbn: string
    title: string
    author: string
    year: string
    quantity: number
  } | null) => {
    if (book) {
      setFormBook(book)
      setIsEditMode(true)
    } else {
      setFormBook({ id: "", isbn: "", title: "", author: "", year: "", quantity: 1 })
      setIsEditMode(false)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // Função para abrir o modal de empréstimos
  const openLoansModal = async (book: any) => {
    setSelectedBookForLoans(book)
    setIsLoadingLoans(true)
    setIsLoansModalOpen(true)
    
    try {
      const result = await getActiveBookLoans(book.id)
      if (result.success) {
        setBookLoans(result.data || [])
      } else {
        toast.error("Erro ao carregar empréstimos do livro.")
      }
    } catch {
      toast.error("Erro ao carregar empréstimos.")
    } finally {
      setIsLoadingLoans(false)
    }
  }

  // Função para tratar a devolução de um livro
  const handleReturnLoan = async (loanId: string) => {
    const result = await returnLoan(loanId)
    
    if (result.success) {
      toast.success("Livro devolvido com sucesso!")
      // Atualizar a lista de empréstimos
      setBookLoans(bookLoans.filter(loan => loan.id !== loanId))
      
      // Atualizar a lista de livros para refletir a mudança na disponibilidade
      const updatedBooks = books.map(book => {
        if (book.id === selectedBookForLoans?.id) {
          return { ...book, available: book.available + 1 }
        }
        return book
      })
      setBooks(updatedBooks)
      
      // Fechar o modal se não houver mais empréstimos
      if (bookLoans.length === 1) {
        setIsLoansModalOpen(false)
      }
    } else {
      toast.error(result.error || "Erro ao devolver livro")
    }
  }

  // Função para tratar o cancelamento de um empréstimo
  const handleCancelLoan = async (loanId: string) => {
    const result = await cancelLoan(loanId)
    
    if (result.success) {
      toast.success("Empréstimo cancelado com sucesso!")
      // Atualizar a lista de empréstimos
      setBookLoans(bookLoans.filter(loan => loan.id !== loanId))
      
      // Atualizar a lista de livros para refletir a mudança na disponibilidade
      const updatedBooks = books.map(book => {
        if (book.id === selectedBookForLoans?.id) {
          return { ...book, available: book.available + 1 }
        }
        return book
      })
      setBooks(updatedBooks)
      
      // Fechar o modal se não houver mais empréstimos
      if (bookLoans.length === 1) {
        setIsLoansModalOpen(false)
      }
    } else {
      toast.error(result.error || "Erro ao cancelar empréstimo")
    }
  }

  const handleCreateOrUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formBook.isbn || !formBook.title || !formBook.author || !formBook.year) {
      toast.error("Preencha todos os campos obrigatórios!")
      return
    }
    
    if (formBook.quantity <= 0) {
      toast.error("A quantidade deve ser pelo menos 1")
      return
    }
    
    if (isEditMode) {
      const result = await updateBook(formBook.id, { 
        title: formBook.title, 
        author: formBook.author,
        year: formBook.year,
        quantity: formBook.quantity
      })
      
      if (result.success) {
        // Recarregar os livros para garantir que temos dados atualizados
        const booksResult = await getBooks(debouncedQuery, currentPage, itemsPerPage)
        if (booksResult.success) {
          setBooks(booksResult.data || [])
          if (booksResult.pagination) {
            setTotalPages(booksResult.pagination.totalPages)
            setTotalItems(booksResult.pagination.total)
          }
        }
        toast.success("Livro atualizado com sucesso!")
        closeModal()
      } else {
        toast.error(result.error || "Erro ao atualizar livro.")
      }
    } else {
      // Check if ISBN already exists
      const checkResult = await getBookByIsbn(formBook.isbn)
      if (checkResult.data) {
        toast.error("Já existe um livro com este ISBN.")
        return
      }

      const result = await createBook({
        isbn: formBook.isbn,
        title: formBook.title,
        author: formBook.author,
        year: formBook.year,
        quantity: formBook.quantity
      })
      
      if (result.success) {
        // Recarregar os livros para garantir que temos dados atualizados
        const booksResult = await getBooks(debouncedQuery, currentPage, itemsPerPage)
        if (booksResult.success) {
          setBooks(booksResult.data || [])
          if (booksResult.pagination) {
            setTotalPages(booksResult.pagination.totalPages)
            setTotalItems(booksResult.pagination.total)
          }
        }
        toast.success("Livro cadastrado com sucesso!")
        closeModal()
      } else {
        toast.error(result.error || "Erro ao cadastrar livro.")
      }
    }
  }

  const handleDeleteBook = async (id: string) => {
    const result = await deleteBook(id)
    
    if (result.success) {
      // Recarregar os livros para garantir que temos dados atualizados
      const booksResult = await getBooks(debouncedQuery, currentPage, itemsPerPage)
      if (booksResult.success) {
        setBooks(booksResult.data || [])
        if (booksResult.pagination) {
          setTotalPages(booksResult.pagination.totalPages)
          setTotalItems(booksResult.pagination.total)
        }
      }
      toast.success("Livro apagado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao apagar livro.")
    }
  }

  // Função para verificar se um livro tem empréstimos ativos
  const hasActiveLoans = (book: any) => {
    return book.quantity > book.available
  }

  // Renderizar paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {books.length} de {totalItems} livros
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
                  <BreadcrumbPage>Livros</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Gerenciamento de Livros</h2>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openModal(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Livro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Editar Livro" : "Cadastrar Livro"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrUpdateBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input 
                      id="isbn"
                      placeholder="Digite o ISBN"
                      value={formBook.isbn}
                      onChange={(e) => setFormBook({ ...formBook, isbn: e.target.value })}
                      disabled={isEditMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input 
                      id="title"
                      placeholder="Digite o título do livro"
                      value={formBook.title}
                      onChange={(e) => setFormBook({ ...formBook, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor</Label>
                    <Input 
                      id="author"
                      placeholder="Digite o nome do autor"
                      value={formBook.author}
                      onChange={(e) => setFormBook({ ...formBook, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input 
                      id="year"
                      placeholder="Digite o ano de publicação"
                      value={formBook.year}
                      onChange={(e) => setFormBook({ ...formBook, year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input 
                      id="quantity"
                      type="number"
                      placeholder="Digite a quantidade"
                      value={formBook.quantity}
                      onChange={(e) => {
                        if (isNaN(parseInt(e.target.value))) {
                          setFormBook({ ...formBook, quantity: 1 })
                          return
                        }
                        setFormBook({ ...formBook, quantity: parseInt(e.target.value) })
                      }}
                      min={1}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit">
                      {isEditMode ? "Salvar alterações" : "Cadastrar Livro"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Livros Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Campo de busca */}
              <div className="flex mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, autor ou ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando livros...</p>
              ) : books.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  {debouncedQuery ? "Nenhum livro encontrado para esta busca." : "Nenhum livro cadastrado."}
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-4 text-sm font-medium text-muted-foreground">
                    <div>ISBN</div>
                    <div>Título</div>
                    <div>Autor</div>
                    <div>Ano</div>
                    <div>Quantidade Total</div>
                    <div>Quantidade Disponível</div>
                    <div>Ações</div>
                  </div>
                  <Separator />
                  <div className="max-h-[500px] space-y-2 overflow-auto">
                    {books.map((book) => (
                      <div key={book.id} className="grid grid-cols-7 items-center gap-4 text-sm">
                        <div>{book.isbn}</div>
                        <div>{book.title}</div>
                        <div>{book.author}</div>
                        <div>{book.year}</div>
                        <div>{book.quantity}</div>
                        <div>{book.available}</div>
                        <div className="flex gap-2">
                          {hasActiveLoans(book) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openLoansModal(book)}
                              title="Ver empréstimos"
                              className="text-blue-600"
                            >
                              <BookOpen className="h-4 w-4" />
                              <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center text-[10px]" variant="destructive">
                                {book.quantity - book.available}
                              </Badge>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openModal(book)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteBook(book.id)}
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

          {/* Modal para ver empréstimos do livro */}
          <Dialog open={isLoansModalOpen} onOpenChange={setIsLoansModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Empréstimos de: {selectedBookForLoans?.title}
                </DialogTitle>
              </DialogHeader>
              
              {isLoadingLoans ? (
                <div className="py-4 text-center">Carregando empréstimos...</div>
              ) : bookLoans.length === 0 ? (
                <div className="py-4 text-center">Nenhum empréstimo ativo para este livro.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-2">Aluno</div>
                    <div>Data Empréstimo</div>
                    <div>Data Devolução</div>
                    <div>Ações</div>
                  </div>
                  <Separator />
                  {bookLoans.map((loan) => (
                    <div key={loan.id} className="grid grid-cols-5 items-center gap-2 text-sm">
                      <div className="col-span-2">
                        <div className="font-medium">{loan.student.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Matrícula: {loan.student.enrollment}
                        </div>
                      </div>
                      <div>
                        {new Date(loan.loanDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <div>{new Date(loan.returnDueDate).toLocaleDateString('pt-BR')}</div>
                        <Badge
                          variant={new Date(loan.returnDueDate) < new Date() ? "destructive" : "outline"}
                          className="mt-1"
                        >
                          {new Date(loan.returnDueDate) < new Date() ? "Atrasado" : "Em dia"}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleReturnLoan(loan.id)}
                          title="Devolver"
                        >
                          Devolver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleCancelLoan(loan.id)}
                          title="Cancelar"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsLoansModalOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
