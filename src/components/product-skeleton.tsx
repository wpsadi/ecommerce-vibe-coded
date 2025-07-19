import { Card, CardContent } from "@/components/ui/card"

export function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-square bg-muted animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-5 bg-muted rounded w-20 animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
          </div>
          <div className="h-8 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
