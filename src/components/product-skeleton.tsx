import { Card, CardContent } from "@/components/ui/card";

export function ProductSkeleton() {
	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<div className="aspect-square animate-pulse bg-muted" />
				<div className="space-y-3 p-4">
					<div className="h-4 animate-pulse rounded bg-muted" />
					<div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
					<div className="flex items-center gap-2">
						<div className="h-5 w-20 animate-pulse rounded bg-muted" />
						<div className="h-4 w-16 animate-pulse rounded bg-muted" />
					</div>
					<div className="h-8 animate-pulse rounded bg-muted" />
				</div>
			</CardContent>
		</Card>
	);
}
