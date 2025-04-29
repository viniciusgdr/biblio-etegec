/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect, useCallback } from "react"
import { ArrowRightLeft, BookCheck, Calendar, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { format, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cancelLoan, createLoan, getActiveLoans, returnLoan, searchBooks, searchStudents } from "@/app/actions/loan"

// Função para debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function EmprestimosPage() {
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca de livros
  const [bookQuery, setBookQuery] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [showBookResults, setShowBookResults] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);

  // Busca de alunos
  const [studentQuery, setStudentQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [showStudentResults, setShowStudentResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);

  const [returnDate, setReturnDate] = useState<Date>(addDays(new Date(), 7));
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Aplicar debounce às consultas
  const debouncedBookQuery = useDebounce(bookQuery, 300);
  const debouncedStudentQuery = useDebounce(studentQuery, 300);

  // Carregar empréstimos ativos
  const loadActiveLoans = useCallback(async () => {
    setIsLoading(true);
    const result = await getActiveLoans();
    if (result.success) {
      setActiveLoans(result.data || []);
    } else {
      toast.error("Erro ao carregar empréstimos ativos");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadActiveLoans();
  }, [loadActiveLoans]);

  // Buscar livros quando a consulta debounced mudar
  useEffect(() => {
    const fetchBooks = async () => {
      if (debouncedBookQuery.length >= 2) {
        setIsSearchingBooks(true);
        const result = await searchBooks(debouncedBookQuery);
        setIsSearchingBooks(false);

        if (result.success) {
          setBooks(result.data || []);
        } else {
          toast.error("Erro ao buscar livros");
        }
      }
    };

    fetchBooks();
  }, [debouncedBookQuery]);

  // Buscar alunos quando a consulta debounced mudar
  useEffect(() => {
    const fetchStudents = async () => {
      if (debouncedStudentQuery.length >= 2) {
        setIsSearchingStudents(true);
        const result = await searchStudents(debouncedStudentQuery);
        setIsSearchingStudents(false);

        if (result.success) {
          setStudents(result.data || []);
        } else {
          toast.error("Erro ao buscar alunos");
        }
      }
    };

    fetchStudents();
  }, [debouncedStudentQuery]);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBook) {
      toast.error("Selecione um livro");
      return;
    }

    if (!selectedStudent) {
      toast.error("Selecione um aluno");
      return;
    }

    if (!returnDate) {
      toast.error("Selecione uma data de devolução");
      return;
    }

    const result = await createLoan({
      bookId: selectedBook.id,
      studentId: selectedStudent.id,
      returnDueDate: returnDate
    });

    if (result.success) {
      toast.success("Empréstimo realizado com sucesso!");
      setSelectedBook(null);
      setSelectedStudent(null);
      setReturnDate(addDays(new Date(), 7));
      setBookQuery("");
      setStudentQuery("");
      loadActiveLoans();
    } else {
      toast.error(result.error || "Erro ao realizar empréstimo");
    }
  };

  const handleReturnLoan = async (id: string) => {
    const result = await returnLoan(id);

    if (result.success) {
      toast.success("Livro devolvido com sucesso!");
      loadActiveLoans();
    } else {
      toast.error(result.error || "Erro ao devolver livro");
    }
  };

  const handleCancelLoan = async (id: string) => {
    const result = await cancelLoan(id);

    if (result.success) {
      toast.success("Empréstimo cancelado com sucesso!");
      loadActiveLoans();
    } else {
      toast.error(result.error || "Erro ao cancelar empréstimo");
    }
  };

  const isLoanLate = (loan: any) => {
    const today = new Date();
    const dueDate = new Date(loan.returnDueDate);
    return today > dueDate;
  };

  // Manipuladores para seleção de livro e aluno
  const selectBook = (book: any) => {
    setSelectedBook(book);
    setBookQuery(`${book.title} (${book.isbn})`);
    setShowBookResults(false);
  };

  const selectStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentQuery(`${student.name} (${student.enrollment})`);
    setShowStudentResults(false);
  };

  // Evento para focus/blur dos campos de busca
  const handleBookInputFocus = () => {
    if (books.length > 0) {
      setShowBookResults(true);
    }
    // Caso o usuário limpe o campo, reseta a seleção
    if (bookQuery === "" && selectedBook) {
      setSelectedBook(null);
    }
  };

  const handleStudentInputFocus = () => {
    if (students.length > 0) {
      setShowStudentResults(true);
    }
    // Caso o usuário limpe o campo, reseta a seleção
    if (studentQuery === "" && selectedStudent) {
      setSelectedStudent(null);
    }
  };

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
                  <BreadcrumbPage>Empréstimos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <h2 className="text-3xl font-bold">Gerenciamento de Empréstimos</h2>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Realizar Novo Empréstimo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLoan} className="space-y-4">
                  {/* Campo de busca de livros */}
                  <div className="space-y-2">
                    <Label htmlFor="book">Livro</Label>
                    <div className="relative">
                      <div className="flex">
                        <Input
                          id="bookQuery"
                          placeholder="Busque por título, autor ou ISBN"
                          value={bookQuery}
                          onChange={(e) => {
                            setBookQuery(e.target.value);
                            setShowBookResults(true);
                            if (e.target.value.length === 0) {
                              setSelectedBook(null);
                            }
                          }}
                          onFocus={handleBookInputFocus}
                          onBlur={() => {
                            // Delay para permitir que o clique nos resultados aconteça
                            setTimeout(() => setShowBookResults(false), 200);
                          }}
                          className="w-full"
                        />
                        {selectedBook && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            onClick={() => {
                              setSelectedBook(null);
                              setBookQuery("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showBookResults && books.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border dark:bg-black  border-gray-200 rounded-md shadow-lg py-1">
                          {isSearchingBooks ? (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              Buscando livros...
                            </div>
                          ) : (
                            books.map(book => (
                              <div
                                key={book.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-blue-950"
                                onMouseDown={() => selectBook(book)}
                              >
                                <div className="font-medium">{book.title}</div>
                                <div className="text-xs text-gray-500">
                                  {book.author} • ISBN: {book.isbn}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Livros que não estão disponíveis para empréstimo não aparecem na busca.
                      </p>
                    </div>
                  </div>

                  {/* Campo de busca de alunos */}
                  <div className="space-y-2">
                    <Label htmlFor="student">Aluno</Label>
                    <div className="relative">
                      <div className="flex">
                        <Input
                          id="studentQuery"
                          placeholder="Busque por nome ou matrícula"
                          value={studentQuery}
                          onChange={(e) => {
                            setStudentQuery(e.target.value);
                            setShowStudentResults(true);
                            if (e.target.value.length === 0) {
                              setSelectedStudent(null);
                            }
                          }}
                          onFocus={handleStudentInputFocus}
                          onBlur={() => {
                            // Delay para permitir que o clique nos resultados aconteça
                            setTimeout(() => setShowStudentResults(false), 200);
                          }}
                          className="w-full"
                        />
                        {selectedStudent && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            onClick={() => {
                              setSelectedStudent(null);
                              setStudentQuery("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {showStudentResults && students.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-black border border-gray-200 rounded-md shadow-lg py-1">
                          {isSearchingStudents ? (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              Buscando alunos...
                            </div>
                          ) : (
                            students.map(student => (
                              <div
                                key={student.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer dark:hover:bg-blue-950"
                                onMouseDown={() => selectStudent(student)}
                              >
                                <div className="font-medium">{student.name}</div>
                                <div className="text-xs text-gray-500">
                                  Matrícula: {student.enrollment}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calendário para escolha da data de devolução */}
                  <div className="space-y-2">
                    <Label htmlFor="returnDate">Data de Devolução</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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

                  <Button type="submit" className="w-full">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Realizar Empréstimo
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Empréstimos Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-muted-foreground">Carregando empréstimos...</p>
                ) : activeLoans.length === 0 ? (
                  <p className="text-center text-muted-foreground">Nenhum empréstimo ativo.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground">
                      <div className="col-span-2">Livro</div>
                      <div>Aluno</div>
                      <div>Empréstimo</div>
                      <div>Devolução</div>
                      <div></div>
                    </div>
                    <Separator />
                    <div className="max-h-[500px] space-y-3 overflow-auto">
                      {activeLoans.map((loan) => (
                        <div key={loan.id} className="grid grid-cols-6 items-center gap-4 text-sm">
                          <div className="col-span-2">
                            <div className="font-medium">{loan.book.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {loan.book.author} • ISBN: {loan.book.isbn}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{loan.student.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Matrícula: {loan.student.enrollment}
                            </div>
                          </div>
                          <div className="text-muted-foreground">
                            {new Date(loan.loanDate).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <div className="font-medium">
                              {new Date(loan.returnDueDate).toLocaleDateString('pt-BR')}
                            </div>
                            <Badge
                              variant={isLoanLate(loan) ? "destructive" : "outline"}
                              className="mt-1"
                            >
                              {isLoanLate(loan) ? "Atrasado" : "Em dia"}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              title="Devolver"
                              onClick={() => handleReturnLoan(loan.id)}
                            >
                              <BookCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Cancelar"
                              onClick={() => handleCancelLoan(loan.id)}
                            >
                              <X className="h-4 w-4" />
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
