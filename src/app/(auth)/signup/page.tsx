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

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isPending, setisPending] = useState(false);
	const { signup } = useAuth();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setisPending(true);

		try {
			const success = await signup(name, email, password, phone);
			if (success) {
				toast.success("Your account has been created successfully!");
				router.push("/");
			} else {
				toast.error("Failed to create account. Please try again.");
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
							<CardTitle>Sign Up</CardTitle>
							<CardDescription>
								Create a new account to get started
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<Label htmlFor="name">Full Name</Label>
									<Input
										id="name"
										type="text"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
										placeholder="Enter your full name"
									/>
								</div>

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
									<Label htmlFor="phone">Phone (Optional)</Label>
									<Input
										id="phone"
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="Enter your phone number"
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
										placeholder="Create a password"
									/>
								</div>

								<div>
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										placeholder="Confirm your password"
									/>
								</div>

								<Button type="submit" className="w-full" disabled={isPending}>
									{isPending ? "Creating Account..." : "Sign Up"}
								</Button>
							</form>

							<div className="mt-6 text-center">
								<p className="text-muted-foreground text-sm">
									Already have an account?{" "}
									<Link href="/login" className="text-primary hover:underline">
										Login
									</Link>
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}
