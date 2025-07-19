"use client";

import { Header } from "@/components/header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";
import { useAllUsers, useToggleUserBlock } from "@/hooks/use-trpc-hooks";
import { Eye, Search, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminUsersPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");

	// tRPC Hooks
	const { data: allUsers, isPending } = useAllUsers({
		role: "user",
		search: searchQuery || undefined,
	});
	const toggleUserBlock = useToggleUserBlock();

	// Use tRPC data or fallback to empty array
	const users = allUsers || [];

	useEffect(() => {
		if (!user || user.role !== "admin") {
			router.push("/login");
		}
	}, [user, router]);

	const handleToggleUserStatus = async (
		userId: string,
		currentBlocked: boolean,
	) => {
		try {
			await toggleUserBlock.mutateAsync({
				userId,
				blocked: !currentBlocked,
			});
		} catch (error) {
			toast.error("Failed to update user status");
		}
	};

	if (!user || user.role !== "admin") {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="font-bold text-3xl">User Management</h1>
					<div className="text-muted-foreground text-sm">
						Total Users: {users.length}
					</div>
				</div>

				{/* Search */}
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Search Users</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
							<Input
								placeholder="Search by name, email, or phone..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Users Table */}
				<Card>
					<CardHeader>
						<CardTitle>Users ({users.length})</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Phone</TableHead>
										<TableHead>Joined</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{isPending ? (
										<TableRow>
											<TableCell colSpan={5} className="py-8 text-center">
												Loading users...
											</TableCell>
										</TableRow>
									) : users.length === 0 ? (
										<TableRow>
											<TableCell colSpan={5} className="py-8 text-center">
												{searchQuery
													? "No users found matching your search"
													: "No users found"}
											</TableCell>
										</TableRow>
									) : (
										users.map((userData) => (
											<TableRow key={userData.id}>
												<TableCell className="font-medium">
													{userData.name}
												</TableCell>
												<TableCell>{userData.email}</TableCell>
												<TableCell>{userData.phone || "N/A"}</TableCell>
												<TableCell>
													{new Date(userData.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															userData.blocked ? "destructive" : "default"
														}
													>
														{userData.blocked ? "Blocked" : "Active"}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2">
														<Link href={`/admin/users/${userData.id}`}>
															<Button variant="ghost" size="sm">
																<Eye className="h-4 w-4" />
															</Button>
														</Link>

														<AlertDialog>
															<AlertDialogTrigger asChild>
																<Button
																	variant="ghost"
																	size="sm"
																	className={
																		userData.blocked
																			? "text-green-500 hover:text-green-700"
																			: "text-red-500 hover:text-red-700"
																	}
																>
																	{userData.blocked ? (
																		<UserCheck className="h-4 w-4" />
																	) : (
																		<UserX className="h-4 w-4" />
																	)}
																</Button>
															</AlertDialogTrigger>
															<AlertDialogContent>
																<AlertDialogHeader>
																	<AlertDialogTitle>
																		{userData.blocked
																			? "Unblock User"
																			: "Block User"}
																	</AlertDialogTitle>
																	<AlertDialogDescription>
																		Are you sure you want to{" "}
																		{userData.blocked ? "unblock" : "block"}{" "}
																		{userData.name}?
																		{!userData.blocked &&
																			" This will prevent them from accessing their account."}
																	</AlertDialogDescription>
																</AlertDialogHeader>
																<AlertDialogFooter>
																	<AlertDialogCancel>Cancel</AlertDialogCancel>
																	<AlertDialogAction
																		onClick={() =>
																			handleToggleUserStatus(
																				userData.id,
																				!userData.blocked,
																			)
																		}
																		className={
																			userData.blocked
																				? "bg-green-500 hover:bg-green-600"
																				: "bg-red-500 hover:bg-red-600"
																		}
																	>
																		{userData.blocked ? "Unblock" : "Block"}
																	</AlertDialogAction>
																</AlertDialogFooter>
															</AlertDialogContent>
														</AlertDialog>
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
