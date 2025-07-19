"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import {
	useCart,
	useCartSummary,
	useClearCart,
	useCreateAddress,
	useCreateOrder,
	useShippingAddresses,
} from "@/hooks/use-trpc-hooks";
import { CreditCard, MapPin, Plus, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CheckoutPage() {
	const { user } = useAuth();
	const router = useRouter();

	const [selectedAddress, setSelectedAddress] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "upi">(
		"cod",
	);
	const [showAddressForm, setShowAddressForm] = useState(false);

	const [newAddress, setNewAddress] = useState({
		firstName: "",
		lastName: "",
		phone: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		postalCode: "",
		country: "India",
		type: "shipping" as const,
	});

	// tRPC Hooks
	const { data: cartItems, isPending: cartLoading } = useCart();
	const { data: cartSummary } = useCartSummary();
	const { data: addresses } = useShippingAddresses();
	const createAddress = useCreateAddress();
	const createOrder = useCreateOrder();
	const clearCart = useClearCart();

	useEffect(() => {
		if (!user) {
			router.push("/login");
			return;
		}

		if (!cartLoading && (!cartItems || cartItems.length === 0)) {
			router.push("/cart");
			return;
		}

		// Auto-select first address if available
		if (addresses && addresses.length > 0 && !selectedAddress) {
			setSelectedAddress(addresses[0]?.id || "");
		}
	}, [user, cartItems, cartLoading, addresses, selectedAddress, router]);

	const handleAddAddress = async () => {
		try {
			const result = await createAddress.mutateAsync(newAddress);
			if (result?.id) {
				setSelectedAddress(result.id);
			}
			setShowAddressForm(false);
			setNewAddress({
				firstName: "",
				lastName: "",
				phone: "",
				addressLine1: "",
				addressLine2: "",
				city: "",
				state: "",
				postalCode: "",
				country: "India",
				type: "shipping" as const,
			});
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	const handlePlaceOrder = async () => {
		if (!cartItems || cartItems.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		if (!selectedAddress) {
			toast.error("Please select a delivery address");
			return;
		}

		const selectedAddr = addresses?.find((addr) => addr.id === selectedAddress);
		if (!selectedAddr) {
			toast.error("Selected address not found");
			return;
		}

		try {
			const orderItems = cartItems.map((item: any) => ({
				productId: item.product.id,
				quantity: item.quantity,
				unitPrice: item.product.price,
			}));

			const orderData = {
				items: orderItems,
				paymentMethod,
				shippingAddress: {
					firstName: selectedAddr.firstName,
					lastName: selectedAddr.lastName,
					phone: selectedAddr.phone || "",
					addressLine1: selectedAddr.addressLine1,
					addressLine2: selectedAddr.addressLine2 || "",
					city: selectedAddr.city,
					state: selectedAddr.state,
					postalCode: selectedAddr.postalCode,
					country: selectedAddr.country,
				},
				customerNotes: "",
			};

			const order = await createOrder.mutateAsync(orderData);
			router.push(`/orders/${order.id}`);
		} catch (error) {
			// Error handling is done in the hook
		}
	};

	if (!user || cartLoading) {
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

	if (!cartItems || cartItems.length === 0) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			<main className="container mx-auto px-4 py-8">
				<h1 className="mb-8 font-bold text-3xl">Checkout</h1>

				<div className="grid gap-8 lg:grid-cols-3">
					{/* Main Content */}
					<div className="space-y-6 lg:col-span-2">
						{/* Delivery Address */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<MapPin className="h-5 w-5" />
										Delivery Address
									</CardTitle>
									<Dialog
										open={showAddressForm}
										onOpenChange={setShowAddressForm}
									>
										<DialogTrigger asChild>
											<Button variant="outline" size="sm">
												<Plus className="mr-2 h-4 w-4" />
												Add New
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Add New Address</DialogTitle>
												<DialogDescription>
													Add a new delivery address for your order
												</DialogDescription>
											</DialogHeader>
											<div className="space-y-4">
												<div className="grid grid-cols-2 gap-4">
													<div>
														<Label htmlFor="firstName">First Name</Label>
														<Input
															id="firstName"
															value={newAddress.firstName}
															onChange={(e) =>
																setNewAddress((prev) => ({
																	...prev,
																	firstName: e.target.value,
																}))
															}
															placeholder="Enter first name"
														/>
													</div>
													<div>
														<Label htmlFor="lastName">Last Name</Label>
														<Input
															id="lastName"
															value={newAddress.lastName}
															onChange={(e) =>
																setNewAddress((prev) => ({
																	...prev,
																	lastName: e.target.value,
																}))
															}
															placeholder="Enter last name"
														/>
													</div>
												</div>
												<div>
													<Label htmlFor="phone">Phone</Label>
													<Input
														id="phone"
														value={newAddress.phone}
														onChange={(e) =>
															setNewAddress((prev) => ({
																...prev,
																phone: e.target.value,
															}))
														}
														placeholder="Enter phone number"
													/>
												</div>
												<div>
													<Label htmlFor="addressLine1">Street Address</Label>
													<Input
														id="addressLine1"
														value={newAddress.addressLine1}
														onChange={(e) =>
															setNewAddress((prev) => ({
																...prev,
																addressLine1: e.target.value,
															}))
														}
														placeholder="Enter street address"
													/>
												</div>
												<div>
													<Label htmlFor="addressLine2">
														Address Line 2 (Optional)
													</Label>
													<Input
														id="addressLine2"
														value={newAddress.addressLine2}
														onChange={(e) =>
															setNewAddress((prev) => ({
																...prev,
																addressLine2: e.target.value,
															}))
														}
														placeholder="Apartment, suite, etc."
													/>
												</div>
												<div className="grid grid-cols-3 gap-4">
													<div>
														<Label htmlFor="city">City</Label>
														<Input
															id="city"
															value={newAddress.city}
															onChange={(e) =>
																setNewAddress((prev) => ({
																	...prev,
																	city: e.target.value,
																}))
															}
															placeholder="City"
														/>
													</div>
													<div>
														<Label htmlFor="state">State</Label>
														<Input
															id="state"
															value={newAddress.state}
															onChange={(e) =>
																setNewAddress((prev) => ({
																	...prev,
																	state: e.target.value,
																}))
															}
															placeholder="State"
														/>
													</div>
													<div>
														<Label htmlFor="postalCode">Postal Code</Label>
														<Input
															id="postalCode"
															value={newAddress.postalCode}
															onChange={(e) =>
																setNewAddress((prev) => ({
																	...prev,
																	postalCode: e.target.value,
																}))
															}
															placeholder="Postal Code"
														/>
													</div>
												</div>
												<Button
													onClick={handleAddAddress}
													className="w-full"
													disabled={createAddress.isPending}
												>
													{createAddress.isPending
														? "Adding..."
														: "Add Address"}
												</Button>
											</div>
										</DialogContent>
									</Dialog>
								</div>
							</CardHeader>
							<CardContent>
								<RadioGroup
									value={selectedAddress}
									onValueChange={setSelectedAddress}
								>
									<div className="space-y-4">
										{addresses && addresses.length > 0 ? (
											addresses.map((address) => (
												<div
													key={address.id}
													className="flex items-start space-x-3 rounded-lg border p-4"
												>
													<RadioGroupItem
														value={address.id}
														id={address.id}
														className="mt-1"
													/>
													<div className="flex-1">
														<div className="mb-1 flex items-center gap-2">
															<Label
																htmlFor={address.id}
																className="cursor-pointer font-medium"
															>
																{address.firstName} {address.lastName}
															</Label>
															{address.isDefault && (
																<span className="rounded bg-primary px-2 py-1 text-primary-foreground text-xs">
																	Default
																</span>
															)}
														</div>
														<p className="text-muted-foreground text-sm">
															{address.addressLine1}
															{address.addressLine2 &&
																`, ${address.addressLine2}`}
															<br />
															{address.city}, {address.state}{" "}
															{address.postalCode}, {address.country}
														</p>
														<p className="text-muted-foreground text-sm">
															{address.phone}
														</p>
													</div>
												</div>
											))
										) : (
											<div className="py-8 text-center">
												<p className="mb-4 text-muted-foreground">
													No saved addresses found
												</p>
												<Button onClick={() => setShowAddressForm(true)}>
													<Plus className="mr-2 h-4 w-4" />
													Add New Address
												</Button>
											</div>
										)}
									</div>
								</RadioGroup>
							</CardContent>
						</Card>

						{/* Payment Method */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CreditCard className="h-5 w-5" />
									Payment Method
								</CardTitle>
							</CardHeader>
							<CardContent>
								<RadioGroup
									value={paymentMethod}
									onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
								>
									<div className="space-y-4">
										<div className="flex items-center space-x-3 rounded-lg border p-4">
											<RadioGroupItem value="cod" id="cod" />
											<div className="flex-1">
												<Label
													htmlFor="cod"
													className="cursor-pointer font-medium"
												>
													Cash on Delivery
												</Label>
												<p className="text-muted-foreground text-sm">
													Pay when your order is delivered
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-3 rounded-lg border p-4">
											<RadioGroupItem value="card" id="card" />
											<div className="flex-1">
												<Label
													htmlFor="card"
													className="cursor-pointer font-medium"
												>
													Credit/Debit Card
												</Label>
												<p className="text-muted-foreground text-sm">
													Pay securely with your card
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-3 rounded-lg border p-4">
											<RadioGroupItem value="upi" id="upi" />
											<div className="flex-1">
												<Label
													htmlFor="upi"
													className="cursor-pointer font-medium"
												>
													UPI
												</Label>
												<p className="text-muted-foreground text-sm">
													Pay using UPI apps
												</p>
											</div>
										</div>
									</div>
								</RadioGroup>
							</CardContent>
						</Card>
					</div>

					{/* Order Summary */}
					<div>
						<Card className="sticky top-24">
							<CardHeader>
								<CardTitle>Order Summary</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Items */}
								<div className="space-y-3">
									{cartItems?.map((item: any) => (
										<div key={item.id} className="flex items-center gap-3">
											<Image
												src={item.primaryImage?.url || "/placeholder.svg"}
												alt={item.product?.name || "Product"}
												width={50}
												height={50}
												className="rounded object-cover"
											/>
											<div className="flex-1">
												<h4 className="font-medium text-sm">
													{item.product?.name || "Product"}
												</h4>
												<p className="text-muted-foreground text-xs">
													Qty: {item.quantity || 0}
												</p>
											</div>
											<span className="font-medium">
												₹
												{(
													Number(item.product?.price || 0) * (item.quantity || 0)
												).toLocaleString()}
											</span>
										</div>
									))}
								</div>

								<Separator />

								{/* Pricing */}
								<div className="space-y-2">
									<div className="flex justify-between">
										<span>
											Subtotal (
											{cartItems?.reduce(
												(sum: number, item: any) => sum + (item.quantity || 0),
												0,
											) || 0}{" "}
											items)
										</span>
										<span>
											₹
											{cartSummary?.subtotal
												? Number(cartSummary.subtotal).toLocaleString()
												: "0"}
										</span>
									</div>
									<div className="flex justify-between">
										<span>Shipping</span>
										<span className="text-green-600">
											Free
										</span>
									</div>
									<div className="flex justify-between">
										<span>Tax</span>
										<span>
											₹0
										</span>
									</div>
									{cartSummary?.savings &&
										Number(cartSummary.savings) > 0 && (
											<div className="flex justify-between text-green-600">
												<span>Discount</span>
												<span>
													-₹{Number(cartSummary.savings).toLocaleString()}
												</span>
											</div>
										)}
								</div>

								<Separator />

								<div className="flex justify-between font-bold text-lg">
									<span>Total</span>
									<span>
										₹
										{cartSummary?.subtotal
											? Number(cartSummary.subtotal).toLocaleString()
											: "0"}
									</span>
								</div>

								{/* Delivery Info */}
								<div className="rounded-lg bg-muted p-3">
									<div className="flex items-center gap-2 text-sm">
										<Truck className="h-4 w-4 text-green-600" />
										<span className="font-medium text-green-600">
											Free Delivery
										</span>
									</div>
									<p className="mt-1 text-muted-foreground text-xs">
										Expected delivery in 3-5 business days
									</p>
								</div>

								<Button
									onClick={handlePlaceOrder}
									disabled={createOrder.isPending || !selectedAddress}
									className="w-full"
									size="lg"
								>
									{createOrder.isPending
										? "Placing Order..."
										: `Place Order - ₹${cartSummary?.subtotal ? Number(cartSummary.subtotal).toLocaleString() : "0"}`}
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
