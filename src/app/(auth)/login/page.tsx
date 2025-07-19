"use client";

import type React from "react";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isPending, setisPending] = useState(false);
	const { login } = useAuth();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setisPending(true);

		try {
			const success = await login(email, password);
			if (success) {
				toast.success("Welcome back!");
				router.push("/");
			} else {
				toast.error("Invalid email or password");
			}
		} catch (error) {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setisPending(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-md">
					<Card>
						<CardHeader>
							<CardTitle>Login</CardTitle>
							<CardDescription>
								Enter your credentials to access your account
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
										placeholder="Enter your email"
									/>
								</div>

								<div>
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										placeholder="Enter your password"
									/>
								</div>

								<Button type="submit" className="w-full" disabled={isPending}>
									{isPending ? "Logging in..." : "Login"}
								</Button>
							</form>

							<div className="mt-6 text-center">
								<p className="text-muted-foreground text-sm">
									Don't have an account?{" "}
									<Link href="/signup" className="text-primary hover:underline">
										Sign up
									</Link>
								</p>
							</div>

							<div className="mt-4 rounded-lg bg-muted p-4">
								<p className="mb-2 font-medium text-sm">Demo Credentials:</p>
								<p className="text-muted-foreground text-xs">
									User: user@example.com / password
									<br />
									Admin: admin@example.com / admin
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
