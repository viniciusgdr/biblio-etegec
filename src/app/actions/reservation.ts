"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createBookReservation(data: { bookId: string; studentEnrollment: string; returnDueDate: Date }) {
  try {
    // Verificar se o livro existe e está disponível
    const book = await prisma.book.findUnique({
      where: { id: data.bookId }
    });
    
    if (!book) {
      return { success: false, error: "Livro não encontrado" };
    }
    
    if (book.available <= 0) {
      return { success: false, error: "Este livro não está mais disponível para reserva" };
    }
    
    // Verificar se o aluno existe
    const student = await prisma.student.findUnique({
      where: { enrollment: data.studentEnrollment }
    });
    
    if (!student) {
      return { success: false, error: "Aluno não encontrado com este número de matrícula" };
    }
    
    // Verificar se já existe uma solicitação pendente para este aluno e livro
    const existingOrder = await prisma.orderLoan.findFirst({
      where: {
        bookId: data.bookId,
        studentId: student.id
      }
    });
    
    if (existingOrder) {
      return { success: false, error: "Já existe uma solicitação pendente para este livro" };
    }
    
    // Criar a ordem de empréstimo
    const order = await prisma.orderLoan.create({
      data: {
        bookId: data.bookId,
        studentId: student.id,
        returnDueDate: data.returnDueDate,
      },
      include: {
        book: true,
        student: true
      }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true, data: order };
  } catch (error) {
    console.error("Failed to create reservation:", error);
    return { success: false, error: "Erro ao processar a solicitação de reserva" };
  }
}

export async function getPendingBookReservations() {
  try {
    const reservations = await prisma.orderLoan.findMany({
      include: {
        book: true,
        student: true
      },
      orderBy: {
        orderDate: 'desc'
      }
    });
    
    return { success: true, data: reservations };
  } catch (error) {
    console.error("Failed to fetch reservations:", error);
    return { success: false, error: "Erro ao carregar solicitações pendentes" };
  }
}

export async function approveReservation(id: string) {
  try {
    // Buscar a reserva
    const reservation = await prisma.orderLoan.findUnique({
      where: { id },
      include: {
        book: true,
        student: true
      }
    });
    
    if (!reservation) {
      return { success: false, error: "Solicitação de reserva não encontrada" };
    }
    
    // Verificar se o livro ainda está disponível
    if (reservation.book.available <= 0) {
      return { success: false, error: "Este livro não está mais disponível para empréstimo" };
    }
    
    // Criar o empréstimo
    const loan = await prisma.loan.create({
      data: {
        bookId: reservation.bookId,
        studentId: reservation.studentId,
        returnDueDate: reservation.returnDueDate,
        loanDate: new Date()
      }
    });
    
    // Atualizar a disponibilidade do livro
    await prisma.book.update({
      where: { id: reservation.bookId },
      data: { available: { decrement: 1 } }
    });
    
    // Remover a solicitação
    await prisma.orderLoan.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true, data: loan };
  } catch (error) {
    console.error("Failed to approve reservation:", error);
    return { success: false, error: "Erro ao aprovar reserva" };
  }
}

export async function rejectReservation(id: string) {
  try {
    // Verificar se a solicitação existe
    const reservation = await prisma.orderLoan.findUnique({
      where: { id }
    });
    
    if (!reservation) {
      return { success: false, error: "Solicitação de reserva não encontrada" };
    }
    
    // Excluir a solicitação
    await prisma.orderLoan.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/emprestimos');
    return { success: true };
  } catch (error) {
    console.error("Failed to reject reservation:", error);
    return { success: false, error: "Erro ao rejeitar reserva" };
  }
}
