"use client";

import { api } from "@/trpc/react";
import { signIn, signOut, useSession } from "next-auth/react";
import { type ReactNode, createContext, useContext } from "react";
import { toast } from "sonner";

interface User {
	id: string;
	name?: string | null;
	email?: string | null;
	phone?: string | null;
	role?: string | null;
}

interface AuthContextType {
	user: User | null;
	login: (email: string, password: string) => Promise<boolean>;
	signup: (
		name: string,
		email: string,
		password: string,
		phone?: string,
	) => Promise<boolean>;
	logout: () => void;
	loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession();
	const user = session?.user ?? null;
	const loading = status === "loading";

	const signupMutation = api.users.signup.useMutation();

	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				toast.error(result.error);
				return false;
			}
			toast.success("Welcome back!");
			return true;
		} catch (error) {
			console.error("Login error:", error);
			toast.error("An unexpected error occurred during login.");
			return false;
		}
	};

	const signup = async (
		name: string,
		email: string,
		password: string,
		phone?: string,
	): Promise<boolean> => {
		try {
			await signupMutation.mutateAsync({ name, email, password, phone });
			toast.success("Your account has been created successfully!");
			return true;
		} catch (error: unknown) {
			console.error("Signup error:", error);
			toast.error(
				error.message || "An unexpected error occurred during signup.",
			);
			return false;
		}
	};

	const logout = () => {
		signOut();
		toast.info("Logged out successfully.");
	};

	return (
		<AuthContext.Provider value={{ user, login, signup, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
