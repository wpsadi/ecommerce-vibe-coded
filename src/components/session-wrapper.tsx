import { auth } from "@/server/auth";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default async function SessionWrapper({ children }: { children: React.ReactNode }) {
  const session = await auth();
  console.log("SessionWrapper - Session:", session); // Debugging
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
