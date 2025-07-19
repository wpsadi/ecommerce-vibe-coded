"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import {
	useAddresses,
	useCreateAddress,
	useDeleteAddress,
	useProfile,
	useUpdateAddress,
	useUpdateProfile,
} from "@/hooks/use-trpc-hooks";
import { Calendar, Edit, Mail, Phone, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
	const { user } = useAuth();
	const router = useRouter();

	const [editing, setEditing] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
	});

	// tRPC Hooks
	const { data: profile, isPending: profileLoading } = useProfile();
	const updateProfile = useUpdateProfile();
	const { data: addresses } = useAddresses("shipping");
	const createAddress = useCreateAddress();
	const deleteAddress = useDeleteAddress();

	useEffect(() => {
		if (!user) {
			router.push("/login");
			return;
		}

		if (profile) {
			setFormData({
				name: profile.name || "",
				email: profile.email || "",
				phone: profile.phone || "",
			});
		}
	}, [user, router, profile]);

	const handleSave = async () => {
		try {
			await updateProfile.mutateAsync({
				name: formData.name,
				phone: formData.phone,
			});
			setEditing(false);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handleCancel = () => {
		if (profile) {
			setFormData({
				name: profile.name || "",
				email: profile.email || "",
				phone: profile.phone || "",
			});
		}
		setEditing(false);
	};

	const handleAddAddress = async (addressData: NewAddress) => {
		try {
			await createAddress.mutateAsync(addressData);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handleDeleteAddress = async (addressId: string) => {
		try {
			await deleteAddress.mutateAsync({ id: addressId });
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	if (!user || profileLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="mb-4 font-bold text-2xl">Loading...</h1>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-4xl">
					<h1 className="mb-8 font-bold text-3xl">My Profile</h1>

					<Tabs defaultValue="profile" className="space-y-6">
						<TabsList>
							<TabsTrigger value="profile">Profile Information</TabsTrigger>
							<TabsTrigger value="addresses">Addresses</TabsTrigger>
							<TabsTrigger value="security">Security</TabsTrigger>
						</TabsList>

						<TabsContent value="profile">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<User className="h-5 w-5" />
											Personal Information
										</CardTitle>
										{!editing && (
											<Button
												variant="outline"
												onClick={() => setEditing(true)}
											>
												<Edit className="mr-2 h-4 w-4" />
												Edit
											</Button>
										)}
									</div>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid gap-6 md:grid-cols-2">
										<div>
											<Label htmlFor="name">Full Name</Label>
											{editing ? (
												<Input
													id="name"
													value={formData.name}
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															name: e.target.value,
														}))
													}
												/>
											) : (
												<div className="mt-2 flex items-center gap-2">
													<User className="h-4 w-4 text-muted-foreground" />
													<span>{profile?.name || "Not provided"}</span>
												</div>
											)}
										</div>

										<div>
											<Label htmlFor="email">Email Address</Label>
											{editing ? (
												<Input
													id="email"
													type="email"
													value={formData.email}
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															email: e.target.value,
														}))
													}
													disabled // Email should not be editable
												/>
											) : (
												<div className="mt-2 flex items-center gap-2">
													<Mail className="h-4 w-4 text-muted-foreground" />
													<span>{profile?.email || "Not provided"}</span>
												</div>
											)}
										</div>

										<div>
											<Label htmlFor="phone">Phone Number</Label>
											{editing ? (
												<Input
													id="phone"
													value={formData.phone}
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															phone: e.target.value,
														}))
													}
													placeholder="Enter phone number"
												/>
											) : (
												<div className="mt-2 flex items-center gap-2">
													<Phone className="h-4 w-4 text-muted-foreground" />
													<span>{profile?.phone || "Not provided"}</span>
												</div>
											)}
										</div>

										<div>
											<Label>Member Since</Label>
											<div className="mt-2 flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span>
													{profile?.createdAt
														? new Date(profile.createdAt).toLocaleDateString()
														: "Not available"}
												</span>
											</div>
										</div>
									</div>

									{editing && (
										<div className="flex gap-4">
											<Button
												onClick={handleSave}
												disabled={updateProfile.isPending}
											>
												{updateProfile.isPending ? "Saving..." : "Save Changes"}
											</Button>
											<Button variant="outline" onClick={handleCancel}>
												Cancel
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="addresses">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle>Saved Addresses</CardTitle>
										<Button
											onClick={() => {
												/* TODO: Add address form */
											}}
										>
											<Plus className="mr-2 h-4 w-4" />
											Add New Address
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									{addresses && addresses.length > 0 ? (
										<div className="space-y-4">
											{addresses.map((address) => (
												<div key={address.id} className="rounded-lg border p-4">
													<div className="flex items-start justify-between">
														<div>
															<h4 className="font-medium">
																{address.firstName} {address.lastName}
															</h4>
															<p className="mt-1 text-muted-foreground text-sm">
																{address.addressLine1}
																{address.addressLine2 &&
																	`, ${address.addressLine2}`}
															</p>
															<p className="text-muted-foreground text-sm">
																{address.city}, {address.state}{" "}
																{address.postalCode}
															</p>
															<p className="text-muted-foreground text-sm">
																{address.country}
															</p>
															{address.phone && (
																<p className="text-muted-foreground text-sm">
																	Phone: {address.phone}
																</p>
															)}
														</div>
														<div className="flex gap-2">
															<Button variant="outline" size="sm">
																Edit
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleDeleteAddress(address.id)}
																disabled={deleteAddress.isPending}
															>
																{deleteAddress.isPending
																	? "Deleting..."
																	: "Delete"}
															</Button>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="py-8 text-center">
											<p className="mb-4 text-muted-foreground">
												No saved addresses yet
											</p>
											<Button>
												<Plus className="mr-2 h-4 w-4" />
												Add New Address
											</Button>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="security">
							<Card>
								<CardHeader>
									<CardTitle>Security Settings</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-center justify-between rounded-lg border p-4">
										<div>
											<h4 className="font-medium">Password</h4>
											<p className="text-muted-foreground text-sm">
												Last updated 3 months ago
											</p>
										</div>
										<Button variant="outline">Change Password</Button>
									</div>

									<div className="flex items-center justify-between rounded-lg border p-4">
										<div>
											<h4 className="font-medium">Two-Factor Authentication</h4>
											<p className="text-muted-foreground text-sm">
												Add an extra layer of security
											</p>
										</div>
										<Button variant="outline">Enable 2FA</Button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
