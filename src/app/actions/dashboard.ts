"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats() {
  try {
    // Total de livros e disponíveis
    const totalBooks = await prisma.book.aggregate({
      _sum: {
        quantity: true
      }
    });
    
    const availableBooks = await prisma.book.count({
      where: { available: { gt: 0 } }
    });

    // Total de alunos
    const totalStudents = await prisma.student.count();

    // Alunos com empréstimos ativos
    const studentsWithActiveLoans = await prisma.student.count({
      where: {
        loans: {
          some: {
            returned: false
          }
        }
      }
    });

    // Empréstimos ativos
    const activeLoans = await prisma.loan.count({
      where: { returned: false }
    });

    // Empréstimos atrasados
    const lateLoans = await prisma.loan.count({
      where: {
        returned: false,
        returnDueDate: {
          lt: new Date()
        }
      }
    });

    // Total de empréstimos
    const totalLoans = await prisma.loan.count();

    // Empréstimos do último mês
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);

    const loansThisMonth = await prisma.loan.count({
      where: {
        loanDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      }
    });

    // Últimos empréstimos
    const recentLoans = await prisma.loan.findMany({
      take: 5,
      orderBy: {
        loanDate: 'desc'
      },
      include: {
        book: true,
        student: true
      }
    });

    // Livros mais emprestados
    const popularBooks = await prisma.book.findMany({
      take: 5,
      orderBy: {
        loans: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: { loans: true }
        }
      }
    });

    return { 
      success: true, 
      data: {
        totalBooks: totalBooks._sum.quantity || 0,
        availableBooks,
        loanedBooks: (totalBooks._sum.quantity || 0) - availableBooks,
        totalStudents,
        studentsWithActiveLoans,
        activeLoans,
        lateLoans,
        totalLoans,
        loansThisMonth,
        recentLoans,
        popularBooks
      }
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return { success: false, error: "Failed to load dashboard statistics" };
  }
}
