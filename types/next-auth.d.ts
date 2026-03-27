import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      subscription_tier: string
      subscription_status: string
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
    subscription_tier: string
    subscription_status: string
    email_verified?: boolean
  }
  
  interface Profile {
    id: string
  }
}
