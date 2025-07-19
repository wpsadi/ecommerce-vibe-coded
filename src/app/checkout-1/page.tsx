"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
	useCheckoutFlow,
	useCreateAddress,
	useUpdateAddress,
} from "@/hooks/use-trpc-hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	CreditCard,
	Home,
	Landmark,
	ShoppingCart,
	Truck,
	Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addressSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	addressLine1: z.string().min(1, "Address is required"),
	addressLine2: z.string().optional(),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	phone: z.string().optional(),
});

const checkoutSchema = z.object({
	shippingAddressId: z.string().min(1, "Please select a shipping address"),
	billingAddressId: z.string().min(1, "Please select a billing address"),
	useSameAsShipping: z.boolean(),
	paymentMethod: z.enum(["cod", "card", "upi", "wallet"], {
		required_error: "Please select a payment method",
	}),
});

export default function CheckoutPage() {
	const router = useRouter();
	const {
		cartItems,
		cartSummary,
		createOrder,
		shippingAddresses,
		billingAddresses,
		isReady,
	} = useCheckoutFlow();

	const [selectedShippingAddress, setSelectedShippingAddress] = useState<
		string | null
	>(null);
	const [selectedBillingAddress, setSelectedBillingAddress] = useState<
		string | null
	>(null);
	const [useSameAsShipping, setUseSameAsShipping] = useState(true);

	const { control, handleSubmit, setValue, watch } = useForm<
		z.infer<typeof checkoutSchema>
	>({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			shippingAddressId: "",
			billingAddressId: "",
			useSameAsShipping: true,
			paymentMethod: "cod" as const,
		},
	});

	const paymentMethod = watch("paymentMethod");

	useEffect(() => {
		if (!createOrder.isPending && !isReady) {
			toast.error("Your cart is empty. Redirecting to shopping page...");
			router.replace("/products");
		}
	}, [createOrder.isPending, isReady, router]);

	useEffect(() => {
		const defaultShipping =
			shippingAddresses.find((a) => a.isDefault) || shippingAddresses[0];
		if (defaultShipping) {
			setSelectedShippingAddress(defaultShipping.id);
			setValue("shippingAddressId", defaultShipping.id);
		}

		const defaultBilling =
			billingAddresses.find((a) => a.isDefault) || billingAddresses[0];
		if (defaultBilling) {
			setSelectedBillingAddress(defaultBilling.id);
			setValue("billingAddressId", defaultBilling.id);
		}
	}, [shippingAddresses, billingAddresses, setValue]);

	useEffect(() => {
		if (useSameAsShipping && selectedShippingAddress) {
			setSelectedBillingAddress(selectedShippingAddress);
			setValue("billingAddressId", selectedShippingAddress);
		}
	}, [useSameAsShipping, selectedShippingAddress, setValue]);

	const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
		const shippingAddress = shippingAddresses.find(
			(a) => a.id === data.shippingAddressId,
		);
		const billingAddress = useSameAsShipping
			? shippingAddress
			: billingAddresses.find((a) => a.id === data.billingAddressId);

		if (!shippingAddress || !billingAddress) {
			toast.error("Please select valid shipping and billing addresses.");
			return;
		}

		try {
			await createOrder.mutateAsync({
				items: cartItems.map((item: any) => ({
					productId: item.product?.id || "",
					quantity: Number(item.quantity) || 1,
					unitPrice: String(item.product?.price || 0),
				})),
				paymentMethod: data.paymentMethod,
				shippingAddress: {
					firstName: shippingAddress.firstName,
					lastName: shippingAddress.lastName,
					addressLine1: shippingAddress.addressLine1,
					city: shippingAddress.city,
					state: shippingAddress.state,
					postalCode: shippingAddress.postalCode,
					country: shippingAddress.country,
				},
				billingAddress: {
					firstName: billingAddress.firstName,
					lastName: billingAddress.lastName,
					addressLine1: billingAddress.addressLine1,
					city: billingAddress.city,
					state: billingAddress.state,
					postalCode: billingAddress.postalCode,
					country: billingAddress.country,
				},
			});
			router.push("/orders");
		} catch (error) {
			// The hook will show the error toast
		}
	};

	if (createOrder.isPending || !isReady) {
		return <div>Loading checkout...</div>;
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<h1 className="mb-8 font-bold text-3xl">Checkout</h1>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="grid grid-cols-1 gap-8 lg:grid-cols-3"
				>
					<div className="space-y-6 lg:col-span-2">
						{/* Shipping Address */}
						<AddressSection
							title="Shipping Address"
							addresses={shippingAddresses}
							selectedAddress={selectedShippingAddress}
							onSelectAddress={(id: string) => {
								setSelectedShippingAddress(id);
								setValue("shippingAddressId", id);
							}}
							type="shipping"
						/>

						{/* Billing Address */}
						<Card>
							<CardHeader>
								<CardTitle>Billing Address</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="mb-4 flex items-center space-x-2">
									<Checkbox
										id="same-as-shipping"
										checked={useSameAsShipping}
										onCheckedChange={(checked) =>
											setUseSameAsShipping(Boolean(checked))
										}
									/>
									<label
										htmlFor="same-as-shipping"
										className="font-medium text-sm"
									>
										Same as shipping address
									</label>
								</div>
								{!useSameAsShipping && (
									<AddressSection
										title="Billing Address"
										addresses={billingAddresses}
										selectedAddress={selectedBillingAddress}
										onSelectAddress={(id: string) => {
											setSelectedBillingAddress(id);
											setValue("billingAddressId", id);
										}}
										type="billing"
									/>
								)}
							</CardContent>
						</Card>

						{/* Payment Method */}
						<Card>
							<CardHeader>
								<CardTitle>Payment Method</CardTitle>
							</CardHeader>
							<CardContent>
								<Controller
									name="paymentMethod"
									control={control}
									render={({ field }) => (
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="space-y-4"
										>
											<PaymentOption
												value="cod"
												label="Cash on Delivery"
												Icon={Wallet}
											/>
											<PaymentOption
												value="card"
												label="Credit/Debit Card"
												Icon={CreditCard}
											/>
											<PaymentOption value="upi" label="UPI" Icon={Landmark} />
										</RadioGroup>
									)}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Order Summary */}
					<div className="space-y-6">
						<Card className="sticky top-8">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5" />
									Order Summary
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									{cartItems.map((item: any) => (
										<div
											key={item.id || Math.random()}
											className="flex items-center justify-between text-sm"
										>
											<span className="line-clamp-1">
												{item.product?.name || "Product"} x {item.quantity || 0}
											</span>
											<span className="font-medium">
												₹
												{(
													Number(item.product?.price || 0) *
													(item.quantity || 0)
												).toFixed(2)}
											</span>
										</div>
									))}
								</div>
								<Separator />
								<div className="space-y-2">
									<div className="flex justify-between">
										<span>Subtotal</span>
										<span>₹{Number(cartSummary?.subtotal).toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-green-600">
										<span>Savings</span>
										<span>-₹{Number(cartSummary?.savings).toFixed(2)}</span>
									</div>
									<div className="flex justify-between">
										<span>Shipping</span>
										<span>Free</span>
									</div>
									<div className="flex justify-between">
										<span>Tax</span>
										<span>₹0.00</span>
									</div>
								</div>
								<Separator />
								<div className="flex justify-between font-bold text-lg">
									<span>Total</span>
									<span>₹{Number(cartSummary?.subtotal).toFixed(2)}</span>
								</div>
								<Button
									type="submit"
									className="w-full"
									size="lg"
									disabled={createOrder.isPending}
								>
									{createOrder.isPending ? "Placing Order..." : "Place Order"}
								</Button>
							</CardContent>
						</Card>
					</div>
				</form>
			</div>
		</div>
	);
}

function AddressSection({
	title,
	addresses,
	selectedAddress,
	onSelectAddress,
	type,
}: {
	title: string;
	addresses: any[];
	selectedAddress: string | null;
	onSelectAddress: (id: string) => void;
	type: string;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>{title}</CardTitle>
				<AddressDialog type={type} addressId={undefined} />
			</CardHeader>
			<CardContent>
				<RadioGroup
					value={selectedAddress || ""}
					onValueChange={onSelectAddress}
					className="space-y-4"
				>
					{addresses.map((address) => (
						<Label
							key={address.id}
							htmlFor={address.id}
							className="flex cursor-pointer items-center gap-4 rounded-md border p-4 hover:bg-accent"
						>
							<RadioGroupItem value={address.id} id={address.id} />
							<div className="text-sm">
								<p className="font-semibold">
									{address.firstName} {address.lastName}
								</p>
								<p>
									{address.addressLine1}, {address.city}, {address.state}{" "}
									{address.postalCode}
								</p>
								<p>{address.country}</p>
								{address.phone && <p>Phone: {address.phone}</p>}
							</div>
						</Label>
					))}
				</RadioGroup>
			</CardContent>
		</Card>
	);
}

function AddressDialog({
	type,
	addressId,
}: { type: string; addressId?: string }) {
	const createAddress = useCreateAddress();
	const updateAddress = useUpdateAddress();
	const [open, setOpen] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(addressSchema),
	});

	const onSubmit = async (data: any) => {
		try {
			if (addressId) {
				await updateAddress.mutateAsync({ id: addressId, ...data });
			} else {
				await createAddress.mutateAsync({ ...data, type });
			}
			setOpen(false);
		} catch (error) {
			// Toast is handled by the hook
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					{addressId ? "Edit Address" : "Add Address"}
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{addressId ? "Edit Address" : "Add New Address"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<Input placeholder="First Name" {...register("firstName")} />
					{errors.firstName && (
						<p className="text-red-500 text-xs">{errors.firstName.message}</p>
					)}
					<Input placeholder="Last Name" {...register("lastName")} />
					{errors.lastName && (
						<p className="text-red-500 text-xs">{errors.lastName.message}</p>
					)}
					<Input placeholder="Address Line 1" {...register("addressLine1")} />
					{errors.addressLine1 && (
						<p className="text-red-500 text-xs">
							{errors.addressLine1.message}
						</p>
					)}
					<Input
						placeholder="Address Line 2 (Optional)"
						{...register("addressLine2")}
					/>
					<Input placeholder="City" {...register("city")} />
					{errors.city && (
						<p className="text-red-500 text-xs">{errors.city.message}</p>
					)}
					<Input placeholder="State" {...register("state")} />
					{errors.state && (
						<p className="text-red-500 text-xs">{errors.state.message}</p>
					)}
					<Input placeholder="Postal Code" {...register("postalCode")} />
					{errors.postalCode && (
						<p className="text-red-500 text-xs">{errors.postalCode.message}</p>
					)}
					<Input placeholder="Country" {...register("country")} />
					{errors.country && (
						<p className="text-red-500 text-xs">{errors.country.message}</p>
					)}
					<Input placeholder="Phone (Optional)" {...register("phone")} />
					<Button
						type="submit"
						disabled={createAddress.isPending || updateAddress.isPending}
					>
						{createAddress.isPending || updateAddress.isPending
							? "Saving..."
							: "Save Address"}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function PaymentOption({
	value,
	label,
	Icon,
}: { value: string; label: string; Icon: any }) {
	return (
		<Label
			htmlFor={value}
			className="flex cursor-pointer items-center gap-4 rounded-md border p-4 hover:bg-accent"
		>
			<RadioGroupItem value={value} id={value} />
			<Icon className="h-6 w-6" />
			<span>{label}</span>
		</Label>
	);
}
