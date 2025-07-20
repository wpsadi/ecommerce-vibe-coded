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
	useUpdateProfile,
} from "@/hooks/use-trpc-hooks";
import type { NewAddress } from "@/server/db/schema";
import { Calendar, Edit, Mail, Phone, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
	const { user } = useAuth();
	const router = useRouter();

	const [editing, setEditing] = useState(false);
	const [addingAddress, setAddingAddress] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
	});
	const [newAddress, setNewAddress] = useState<NewAddress>({
		type: "shipping",
		userId: user ? user.id : "",
		firstName: "",
		lastName: "",
		addressLine1: "",
		city: "",
		state: "",
		postalCode: "",
		country: "India",
	});

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
		} catch {}
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

	const handleAddAddress = async () => {
		try {
			await createAddress.mutateAsync({
				...newAddress,
				phone: newAddress.phone || undefined,
				company: newAddress.company || undefined,
				type: newAddress!.type! === "shipping" ? "shipping" : "billing",
				addressLine2: newAddress.addressLine2 || undefined,
				country: newAddress.country || "India", // Ensure country is always a string
			});
			setNewAddress({
				type: "shipping",
				userId: user!.id,
				firstName: "",
				lastName: "",
				addressLine1: "",
				city: "",
				state: "",
				postalCode: "",
				country: "India",
			});
			setAddingAddress(false);
			toast.success("Address added");
		} catch {}
	};

	const handleDeleteAddress = async (addressId: string) => {
		try {
			await deleteAddress.mutateAsync({ id: addressId });
		} catch {}
	};

	if (!user || profileLoading) {
		return (
			<div className="min-h-screen bg-background">
				<Header />
				<main className="container mx-auto px-4 py-8 text-center">
					<h1 className="mb-4 font-bold text-2xl">Loading...</h1>
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
						</TabsList>

						{/* Profile Tab */}
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
										{/* Name */}
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
												<p className="mt-2">
													{profile?.name || "Not provided"}
												</p>
											)}
										</div>

										{/* Email */}
										<div>
											<Label>Email Address</Label>
											<p className="mt-2">{profile?.email || "Not provided"}</p>
										</div>

										{/* Phone */}
										<div>
											<Label>Phone</Label>
											{editing ? (
												<Input
													value={formData.phone}
													onChange={(e) =>
														setFormData((prev) => ({
															...prev,
															phone: e.target.value,
														}))
													}
												/>
											) : (
												<p className="mt-2">
													{profile?.phone || "Not provided"}
												</p>
											)}
										</div>

										{/* Joined At */}
										<div>
											<Label>Member Since</Label>
											<p className="mt-2">
												{profile?.createdAt
													? new Date(profile.createdAt).toLocaleDateString()
													: "N/A"}
											</p>
										</div>
									</div>

									{editing && (
										<div className="flex gap-4">
											<Button onClick={handleSave}>
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

						{/* Address Tab */}
						<TabsContent value="addresses">
							<Card>
								<CardHeader className="flex items-center justify-between">
									<CardTitle>Saved Addresses</CardTitle>
									<Button onClick={() => setAddingAddress(true)}>
										<Plus className="mr-2 h-4 w-4" />
										Add Address
									</Button>
								</CardHeader>

								<CardContent>
									{addresses && addresses.length > 0 ? (
										<div className="space-y-4">
											{addresses.map((address) => (
												<div key={address.id} className="rounded border p-4">
													<h4 className="font-medium">
														{address.firstName} {address.lastName}
													</h4>
													<p>
														{address.addressLine1}
														{address.addressLine2 &&
															`, ${address.addressLine2}`}
													</p>
													<p>
														{address.city}, {address.state} {address.postalCode}
													</p>
													<p>{address.country}</p>
													{address.phone && <p>Phone: {address.phone}</p>}

													<div className="mt-2 flex gap-2">
														<Button variant="outline" size="sm" disabled>
															Edit
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleDeleteAddress(address.id)}
														>
															Delete
														</Button>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-muted-foreground">No addresses saved.</p>
									)}

									{/* New Address Form */}
									{addingAddress && (
										<div className="mt-6 space-y-4 border-t pt-4">
											<h4 className="font-semibold">Add New Address</h4>
											<div className="grid gap-4 md:grid-cols-2">
												<Input
													placeholder="First Name"
													value={newAddress.firstName}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															firstName: e.target.value,
														}))
													}
												/>
												<Input
													placeholder="Last Name"
													value={newAddress.lastName}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															lastName: e.target.value,
														}))
													}
												/>
												<Input
													placeholder="Address Line 1"
													value={newAddress.addressLine1}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															addressLine1: e.target.value,
														}))
													}
												/>
												<Input
													placeholder="City"
													value={newAddress.city}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															city: e.target.value,
														}))
													}
												/>
												<Input
													placeholder="State"
													value={newAddress.state}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															state: e.target.value,
														}))
													}
												/>
												<Input
													placeholder="Postal Code"
													value={newAddress.postalCode}
													onChange={(e) =>
														setNewAddress((prev) => ({
															...prev,
															postalCode: e.target.value,
														}))
													}
												/>
											</div>
											<div className="flex gap-2">
												<Button onClick={handleAddAddress}>Save</Button>
												<Button
													variant="outline"
													onClick={() => setAddingAddress(false)}
												>
													Cancel
												</Button>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</main>
		</div>
	);
}
