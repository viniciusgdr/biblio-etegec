import NextAuth from "next-auth"
import Credentials from 'next-auth/providers/credentials'
import { getUserFromDb } from '@/infra/app/prisma/user'
import { verifyPassword } from '@/utils/password'
 
export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "Email",
          placeholder: "johndoe@gmail.com",
        },
        password: {
          type: "password",
          label: "Password",
          placeholder: "*****",
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorize: async (credentials: any) => {
        if (!credentials || !credentials.email || !credentials.password) {
          return null
        }

        const user = await getUserFromDb(credentials.email)
        if (!user) {
          throw new Error("Invalid credentials.")
        }

        if (!user.password) {
          throw new Error("User does not have a password.")
        }

        // Check if the password is correct
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Invalid credentials.")
        }

        // return user object with their profile data
        return user
      },
    })
  ],
  callbacks: {
    authorized: async ({ auth, request }) => {
      const protectedRoutes = ["/dashboard"]
      const isProtectedRoute = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
      )
      const isAuthenticated = auth?.user
        ? true
        : false
      if (isProtectedRoute && !isAuthenticated) {
        return false
      }
      return true
    },
  }
})