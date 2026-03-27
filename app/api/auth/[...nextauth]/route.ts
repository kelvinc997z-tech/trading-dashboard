import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// MicrosoftProvider requires additional setup - commenting out for now until properly configured
// import MicrosoftProvider from "next-auth/providers/microsoft"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { getSession } from "next-auth/react"
import { readUsers, createUser, updateUser, findUserByEmail, generateVerificationToken } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // MicrosoftProvider temporarily disabled - need proper configuration
    // MicrosoftProvider({
    //   clientId: process.env.MICROSOFT_CLIENT_ID!,
    //   clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    //   authorization: { params: { scope: "openid email profile" } },
    // }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const users = await readUsers();
        const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
        if (!user || !user.password) return null;
        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;
        
        // Check email verification for credentials login
        if (!user.email_verified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscription_tier: user.subscription_tier,
          subscription_status: user.subscription_status,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.subscription_tier = user.subscription_tier;
        token.subscription_status = user.subscription_status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.subscription_tier = token.subscription_tier as string;
        session.user.subscription_status = token.subscription_status as string;
      }
      return session;
    },
    async signUp({ account, profile }) {
      if (account.provider === 'google' && profile.email) {
        const existing = await findUserByEmail(profile.email);
        if (!existing) {
          await createUser(profile.email, profile.name || profile.email, undefined, {
            provider: 'google',
            provider_id: profile.id,
          });
        }
      }
      // Microsoft signup disabled for now
      // if (account.provider === 'microsoft' && profile.email) {
      //   const existing = await findUserByEmail(profile.email);
      //   if (!existing) {
      //     await createUser(profile.email, profile.name || profile.email, undefined, {
      //       provider: 'microsoft',
      //       provider_id: profile.id,
      //     });
      //   }
      // }
      return true;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  // Enable debug in development
  // debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
