import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Biblioteca ETEGEC</h1>
        <p className="text-xl mb-8">Sistema de gerenciamento da biblioteca escolar</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full" size="lg">
              Acessar Sistema
            </Button>
          </Link>
          <Link href="/catalogo" className="w-full sm:w-auto">
            <Button className="w-full" size="lg" variant="outline">
              <BookOpen className="mr-2 h-5 w-5" />
              Catálogo de Livros
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
