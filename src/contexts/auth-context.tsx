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
	const { data: session, status, update } = useSession();
	const user = session?.user ?? null;
	const loading = status === "loading";

	// Add console logging for debugging
	console.log("AuthProvider - Session:", session);
	console.log("AuthProvider - User:", user);
	console.log("AuthProvider - Status:", status);

	const signupMutation = api.users.signup.useMutation();

	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			console.log("Login attempt for:", email);
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			console.log("SignIn result:", result);

			if (result?.error) {
				console.error("Login error from signIn:", result.error);
				toast.error("Invalid email or password");
				return false;
			}

			if (result?.ok) {
				// Force session update after successful login
				await update();
				toast.success("Welcome back!");
				return true;
			}

			// This shouldn't happen, but handle it
			console.error("Unexpected login result:", result);
			toast.error("An unexpected error occurred during login.");
			return false;
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
			console.log("Signup attempt for:", email);
			await signupMutation.mutateAsync({ name, email, password, phone });

			console.log("User created, attempting login...");
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			console.log("Signup login result:", result);

			if (result?.error) {
				console.error("Signup login error:", result.error);
				toast.error(
					"Account created but login failed. Please try logging in manually.",
				);
				return false;
			}

			if (result?.ok) {
				// Force session update after successful signup
				await update();
				toast.success("Your account has been created successfully!");
				return true;
			}

			console.error("Unexpected signup result:", result);
			toast.error(
				"Account created but login failed. Please try logging in manually.",
			);
			return false;
		} catch (error) {
			console.error("Signup error:", error);
			if (error instanceof Error && error.message.includes("already exists")) {
				toast.error("An account with this email already exists.");
			} else {
				toast.error("An unexpected error occurred during signup.");
			}
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
