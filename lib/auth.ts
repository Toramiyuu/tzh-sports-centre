import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        const isEmail = identifier.includes("@");

        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: identifier }
            : { phone: identifier.replace(/\D/g, "") },
        });

        if (!user || !user.passwordHash) {
          console.warn(
            `[AUTH] Failed login: user not found for ${isEmail ? "email" : "phone"} "${identifier}"`,
          );
          return null;
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
          console.warn(
            `[AUTH] Failed login: wrong password for user ${user.email} (id: ${user.id})`,
          );
          return null;
        }

        const teacherRecord = await prisma.teacher.findUnique({
          where: { userId: user.id },
          select: { isActive: true },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          isMember: user.isMember,
          isTrainee: user.isTrainee,
          isTeacher: !!teacherRecord?.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as Record<string, unknown>).isAdmin ?? false;
        token.isMember = (user as Record<string, unknown>).isMember ?? false;
        token.isTrainee = (user as Record<string, unknown>).isTrainee ?? false;
        token.isTeacher = (user as Record<string, unknown>).isTeacher ?? false;
      } else if (token.id && token.isMember === undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isMember: true, isTrainee: true },
        });
        token.isMember = dbUser?.isMember ?? false;
        token.isTrainee = dbUser?.isTrainee ?? false;
        const teacherRec = await prisma.teacher.findUnique({
          where: { userId: token.id as string },
          select: { isActive: true },
        });
        token.isTeacher = !!teacherRec?.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isMember = token.isMember as boolean;
        session.user.isTrainee = token.isTrainee as boolean;
        session.user.isTeacher = (token.isTeacher as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
});
