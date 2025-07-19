import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
