/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStudents(query = "", page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    let whereCondition: any = {};
    if (query && query.trim() !== "") {
      whereCondition = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { enrollment: { contains: query, mode: 'insensitive' } }
        ]
      };
    }
    
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        },
        include: {
          class: true
        }
      }),
      prisma.student.count({
        where: whereCondition
      })
    ]);
    
    return { 
      success: true, 
      data: students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    };
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return { success: false, error: "Failed to load students" };
  }
}

export async function createStudent(data: { 
  enrollment: string; 
  name: string; 
  phone?: string;
  classId?: string;
}) {
  try {
    const student = await prisma.student.create({
      data
    });
    
    revalidatePath('/dashboard/alunos');
    return { success: true, data: student };
  } catch (error) {
    console.error("Failed to create student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudent(id: string, data: { 
  name: string; 
  phone: string | null;
  classId?: string | null;
}) {
  try {
    const student = await prisma.student.update({
      where: { id },
      data
    });
    
    revalidatePath('/dashboard/alunos');
    return { success: true, data: student };
  } catch (error) {
    console.error("Failed to update student:", error);
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    // Verificar se o estudante possui empréstimos ativos
    const activeLoans = await prisma.loan.count({
      where: {
        studentId: id,
        returned: false
      }
    });

    if (activeLoans > 0) {
      return { 
        success: false, 
        error: "Cannot delete student with active loans" 
      };
    }

    await prisma.student.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/alunos');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete student:", error);
    return { success: false, error: "Failed to delete student" };
  }
}

export async function getStudentByEnrollment(enrollment: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { enrollment }
    });
    
    return { success: true, data: student };
  } catch (error) {
    console.error("Failed to fetch student:", error);
    return { success: false, error: "Failed to find student" };
  }
}

export async function getAvailableClasses() {
  try {
    const classes = await prisma.class.findMany({
      orderBy: [
        { year: 'desc' },
        { name: 'asc' }
      ]
    });
    
    return { success: true, data: classes };
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return { success: false, error: "Failed to load classes" };
  }
}
