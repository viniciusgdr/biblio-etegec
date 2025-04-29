"use client"

import React, { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, BookOpen, Calendar, UserRound } from "lucide-react"
import { getPublicAvailableBooks } from "@/app/actions/book"
import { createBookReservation } from "@/app/actions/reservation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function CatalogoPage() {
  const [books, setBooks] = useState<{
    id: string
    isbn: string
    title: string
    author: string
    year: string
    available: number
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Estados para busca e paginação
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 12
  
  // Estados para reserva
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false)
  const [selectedBookForReservation, setSelectedBookForReservation] = useState<any>(null)
  const [studentEnrollment, setStudentEnrollment] = useState("")
  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 7))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setCurrentPage(1) // Resetar para primeira página ao buscar
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Efeito para carregar livros disponíveis
  useEffect(() => {
    async function loadBooks() {
      setIsLoading(true)
      const result = await getPublicAvailableBooks(debouncedQuery, currentPage, itemsPerPage)
      if (result.success) {
        setBooks(result.data || [])
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages)
          setTotalItems(result.pagination.total)
        }
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
  
  // Função para abrir o modal de reserva
  const openReservationModal = (book: any) => {
    setSelectedBookForReservation(book)
    setIsReservationModalOpen(true)
    setStudentEnrollment("")
    setReturnDate(addDays(new Date(), 7))
  }
  
  // Função para submeter a reserva
  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentEnrollment.trim()) {
      toast.error("Por favor, informe o número de matrícula.")
      return
    }
    
    if (!returnDate) {
      toast.error("Por favor, selecione uma data de devolução.")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const result = await createBookReservation({
        bookId: selectedBookForReservation.id,
        studentEnrollment,
        returnDueDate: returnDate
      })
      
      if (result.success) {
        toast.success("Solicitação de reserva enviada com sucesso! Aguarde a aprovação de um administrador.")
        setIsReservationModalOpen(false)
      } else {
        toast.error(result.error || "Erro ao enviar solicitação de reserva.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizar paginação
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex items-center justify-between mt-8">
        <div className="text-sm text-muted-foreground">
          Mostrando {books.length} de {totalItems} livros disponíveis
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
    <div className="container mx-auto py-8">
      <header className="mb-8 text-center">
        <Link href="/">
          <h1 className="text-3xl font-bold mb-2">Biblioteca ETEGEC</h1>
        </Link>
        <p className="text-muted-foreground mb-8">Catálogo de Livros Disponíveis</p>
        
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, autor ou ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </header>
      
      <main>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Carregando livros...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h2 className="text-xl font-medium mb-2">Nenhum livro encontrado</h2>
            <p className="text-muted-foreground">
              {debouncedQuery 
                ? "Tente usar termos de busca diferentes."
                : "Não há livros disponíveis no momento."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
              {books.map((book) => (
                <Card key={book.id} className="flex flex-col overflow-hidden h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                        <CardDescription className="mt-2">{book.author}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ano:</span>
                        <span>{book.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ISBN:</span>
                        <span>{book.isbn}</span>
                      </div>
                    </div>
                  </CardContent>
                  <Separator />
                  <CardFooter className="pt-4">
                    <div className="w-full flex justify-between items-center">
                      <Badge variant="outline" className={
                        book.available === 0 ? "bg-red-500 text-white" : "bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-50"
                      }>
                        {book.available ? book.available : ''} {book.available === 0 ? 'Nenhum disponível' : book.available === 1 ? 'disponível' : 'disponíveis'}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => openReservationModal(book)}
                        disabled={book.available === 0}
                      >
                        <BookOpen className="h-4 w-4 mr-2" /> Reservar
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {renderPagination()}
          </>
        )}
      </main>
      
      <footer className="mt-12 text-center border-t pt-6 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Biblioteca ETEGEC. Todos os direitos reservados.</p>
        <div className="mt-2">
          <Link href="/dashboard" className="hover:underline">Área administrativa</Link>
        </div>
      </footer>
      
      {/* Modal de Reserva */}
      <Dialog open={isReservationModalOpen} onOpenChange={setIsReservationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Reserva de Livro</DialogTitle>
           
            {selectedBookForReservation && (
                <div className="mt-2">
                  <span className="block font-medium">{selectedBookForReservation.title}</span>
                  <span className="block text-sm text-muted-foreground">{selectedBookForReservation.author}</span>
                </div>
              )}
          </DialogHeader>
          
          <form onSubmit={handleSubmitReservation}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="enrollment">Número de Matrícula</Label>
                <div className="flex">
                  <UserRound className="mr-2 h-4 w-4 mt-2.5 text-muted-foreground" />
                  <Input 
                    id="enrollment"
                    placeholder="Digite seu número de matrícula"
                    value={studentEnrollment}
                    onChange={(e) => setStudentEnrollment(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Informe o número de matrícula registrado na biblioteca.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="returnDate">Data de Devolução</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="returnDate"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {returnDate ? (
                        format(returnDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={returnDate}
                      onSelect={(date) => {
                        setReturnDate(date || addDays(new Date(), 7));
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
