/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveLoans() {
  try {
    const loans = await prisma.loan.findMany({
      where: {
        returned: false
      },
      include: {
        book: true,
        student: true
      },
      orderBy: {
        loanDate: 'desc'
      }
    });
    
    return { success: true, data: loans };
  } catch (error) {
    console.error("Failed to fetch active loans:", error);
    return { success: false, error: "Failed to load active loans" };
  }
}

export async function getAllLoans() {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        book: true,
        student: true
      },
      orderBy: {
        loanDate: 'desc'
      }
    });
    
    return { success: true, data: loans };
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    return { success: false, error: "Failed to load loans" };
  }
}

export async function createLoan(data: { bookId: string; studentId: string; returnDueDate: Date }) {
  try {
    // Verificar se o livro está disponível
    const book = await prisma.book.findUnique({
      where: { id: data.bookId }
    });
    
    if (!book || !book.available) {
      return { success: false, error: "Livro não está disponível para empréstimo" };
    }
    
    // Criar o empréstimo e atualizar o status do livro
    const loan = await prisma.loan.create({
      data: {
        bookId: data.bookId,
        studentId: data.studentId,
        returnDueDate: data.returnDueDate,
        loanDate: new Date()
      },
      include: {
        book: true,
        student: true
      }
    });
    
    // Atualizar o status do livro
    await prisma.book.update({
      where: { id: data.bookId },
      data: { quantity: { decrement: 1 } }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true, data: loan };
  } catch (error) {
    console.error("Failed to create loan:", error);
    return { success: false, error: "Failed to create loan" };
  }
}

export async function returnLoan(id: string) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id }
    });
    
    if (!loan) {
      return { success: false, error: "Empréstimo não encontrado" };
    }
    
    if (loan.returned) {
      return { success: false, error: "Este livro já foi devolvido" };
    }
    
    // Atualizar o empréstimo
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: { 
        returned: true,
        actualReturnDate: new Date()
      },
      include: {
        book: true,
        student: true
      }
    });
    
    // Atualizar o status do livro
    await prisma.book.update({
      where: { id: loan.bookId },
      data: { 
        quantity: { increment: 1 }
      }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true, data: updatedLoan };
  } catch (error) {
    console.error("Failed to return loan:", error);
    return { success: false, error: "Failed to return loan" };
  }
}

export async function cancelLoan(id: string) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: { book: true }
    });
    
    if (!loan) {
      return { success: false, error: "Empréstimo não encontrado" };
    }
    
    // Deletar o empréstimo
    await prisma.loan.delete({
      where: { id }
    });
    
    // Atualizar o status do livro
    await prisma.book.update({
      where: { id: loan.bookId },
      data: { 
        quantity: { increment: 1 }
      }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel loan:", error);
    return { success: false, error: "Failed to cancel loan" };
  }
}

export async function searchBooks(query: string) {
  try {
    let whereCondition: any = {
      quantity: { gt: 0 }
    };

    // Se houver uma query, adiciona-se filtros de busca
    if (query && query.trim() !== "") {
      whereCondition = {
        AND: [
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { author: { contains: query, mode: 'insensitive' } },
              { isbn: { contains: query, mode: 'insensitive' } }
            ]
          },
          { 
            quantity: { gt: 0 }
          }
        ]
      };
    }

    const books = await prisma.book.findMany({
      where: whereCondition,
      orderBy: { title: 'asc' },
      take: 20
    });
    
    return { success: true, data: books };
  } catch (error) {
    console.error("Failed to search books:", error);
    return { success: false, error: "Failed to search books" };
  }
}

export async function searchStudents(query: string) {
  try {
    let whereCondition: any = {};

    // Se houver uma query, adiciona-se filtros de busca
    if (query && query.trim() !== "") {
      whereCondition = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { enrollment: { contains: query, mode: 'insensitive' } }
        ]
      };
    }

    const students = await prisma.student.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      take: 20
    });
    
    return { success: true, data: students };
  } catch (error) {
    console.error("Failed to search students:", error);
    return { success: false, error: "Failed to search students" };
  }
}
