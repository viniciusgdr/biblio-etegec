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
import { createBook, deleteBook, getBookByIsbn, getBooks, updateBook } from "@/app/actions/book"

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
  
  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true)
      const result = await getBooks()
      if (result.success) {
        setBooks(result.data || [])
      } else {
        toast.error("Erro ao carregar livros.")
      }
      setIsLoading(false)
    }
    
    loadBooks()
  }, [])

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
        setBooks(books.map(b => b.id === formBook.id && result.data ? result.data : b))
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
        if (result.data) {
          setBooks([...books, result.data])
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
      setBooks(books.filter(book => book.id !== id))
      toast.success("Livro apagado com sucesso!")
    } else {
      toast.error(result.error || "Erro ao apagar livro.")
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
                      onChange={(e) => setFormBook({ ...formBook, quantity: parseInt(e.target.value) })}
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
              {isLoading ? (
                <p className="text-center text-muted-foreground">Carregando livros...</p>
              ) : books.length === 0 ? (
                <p className="text-center text-muted-foreground">Nenhum livro cadastrado.</p>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
