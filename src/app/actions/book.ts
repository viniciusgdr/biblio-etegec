"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBooks() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        title: 'asc'
      }
    });
    
    return { success: true, data: books };
  } catch (error) {
    console.error("Failed to fetch books:", error);
    return { success: false, error: "Failed to load books" };
  }
}

export async function createBook(data: { isbn: string; title: string; author: string; year: string; quantity?: number }) {
  try {
    const quantity = data.quantity ? parseInt(data.quantity.toString()) : 1
    const book = await prisma.book.create({
      data: {
        ...data,
        quantity,
        available: quantity
      }
    });
    
    revalidatePath('/dashboard/livros');
    return { success: true, data: book };
  } catch (error) {
    console.error("Failed to create book:", error);
    return { success: false, error: "Failed to create book" };
  }
}

export async function updateBook(id: string, data: { title: string; author: string; year: string; quantity?: number }) {
  try {
    const quantity = data.quantity ? parseInt(data.quantity.toString()) : 1
    const existingBook = await prisma.book.findUnique({
      where: { id }
    });
    if (!existingBook) {
      return { success: false, error: "Book not found" };
    }

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...data,
        quantity,
        // Se a quantidade foi alterada, atualiza a quantidade disponível
        available: existingBook.available + (quantity - existingBook.quantity)
      }
    });
    
    revalidatePath('/dashboard/livros');
    return { success: true, data: book };
  } catch (error) {
    console.error("Failed to update book:", error);
    return { success: false, error: "Failed to update book" };
  }
}

export async function deleteBook(id: string) {
  try {
    // Verificar se o livro possui empréstimos ativos
    const activeLoans = await prisma.loan.count({
      where: {
        bookId: id,
        returned: false
      }
    });

    if (activeLoans > 0) {
      return { 
        success: false, 
        error: "Cannot delete book with active loans" 
      };
    }

    await prisma.book.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/livros');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete book:", error);
    return { success: false, error: "Failed to delete book" };
  }
}

export async function getBookByIsbn(isbn: string) {
  try {
    const book = await prisma.book.findUnique({
      where: { isbn }
    });
    
    return { success: true, data: book };
  } catch (error) {
    console.error("Failed to fetch book:", error);
    return { success: false, error: "Failed to find book" };
  }
}
