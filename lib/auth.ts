import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null
        }

        const identifier = credentials.identifier as string
        const password = credentials.password as string

        // Check if identifier is email or phone
        const isEmail = identifier.includes('@')

        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: identifier }
            : { phone: identifier.replace(/\D/g, '') }, // Strip non-digits for phone
        })

        if (!user || !user.passwordHash) {
          console.warn(`[AUTH] Failed login: user not found for ${isEmail ? 'email' : 'phone'} "${identifier}"`)
          return null
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)

        if (!passwordMatch) {
          console.warn(`[AUTH] Failed login: wrong password for user ${user.email} (id: ${user.id})`)
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as Record<string, unknown>).isAdmin ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
