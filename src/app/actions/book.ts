/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBooks(query = "", page = 1, limit = 10, onlyAvailable = false) {
  try {
    const skip = (page - 1) * limit;
    
    let whereCondition: any = {};
    
    // Adiciona condição para filtrar por disponibilidade
    if (onlyAvailable) {
      whereCondition.available = { gt: 0 };
    }
    
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
          // Manter filtro de disponibilidade se estiver ativo
          ...(onlyAvailable ? [{ available: { gt: 0 } }] : [])
        ]
      };
    }
    
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          title: 'asc'
        }
      }),
      prisma.book.count({
        where: whereCondition
      })
    ]);
    
    return { 
      success: true, 
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    };
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

export async function getPublicAvailableBooks(query = "", page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    let whereCondition: any = {
    };
    
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
        ]
      };
    }
    
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          title: 'asc'
        },
        select: {
          id: true,
          isbn: true,
          title: true,
          author: true,
          year: true,
          available: true,
        }
      }),
      prisma.book.count({
        where: whereCondition
      })
    ]);
    
    return { 
      success: true, 
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    };
  } catch (error) {
    console.error("Failed to fetch public books:", error);
    return { success: false, error: "Failed to load books" };
  }
}

export async function searchBookByIsbn(isbn: string) {
  try {
    // Remove any non-numeric characters from ISBN
    const cleanedIsbn = isbn.replace(/\D/g, '');
    
    if (!cleanedIsbn || cleanedIsbn.length < 10) {
      return { success: false, error: "ISBN inválido" };
    }

    const response = await fetch("https://isbn-search-br.search.windows.net/indexes/isbn-index/docs/search?api-version=2016-09-01", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "accept-language": "pt-BR,pt;q=0.9",
        "api-key": "100216A23C5AEE390338BBD19EA86D29",
        "content-type": "application/json; charset=UTF-8",
        "Referer": "https://www.cblservicos.org.br/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      body: JSON.stringify({
        "searchMode": "any",
        "searchFields": "FormattedKey,RowKey",
        "queryType": "full",
        "search": cleanedIsbn,
        "top": 1,
        "select": "Authors,Date,Imprint,Title,Subtitle,Ano,IdiomasObra",
        "skip": 0,
        "count": true
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.value || data.value.length === 0) {
      return { success: false, error: "Livro não encontrado pelo ISBN" };
    }

    const bookData = data.value[0];
    return { 
      success: true, 
      data: {
        title: bookData.Title || '',
        author: bookData.Authors || bookData.Imprint || '',
        year: bookData.Ano || bookData.Date.includes('-') ? bookData.Date.split('-')[0] : '',
      } 
    };
  } catch (error) {
    console.error("Failed to fetch book by ISBN:", error);
    return { success: false, error: "Erro ao buscar informações do livro" };
  }
}
