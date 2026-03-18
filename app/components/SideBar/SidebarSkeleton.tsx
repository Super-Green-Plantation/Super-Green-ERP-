import { Skeleton } from "@/components/ui/skeleton";

interface SidebarSkeletonProps {
  isCollapsed: boolean;
}

export function SidebarSkeleton({ isCollapsed }: SidebarSkeletonProps) {
  return (
    <aside
      className={`flex flex-col fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 z-50 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header Area Skeleton */}
      <div className="flex items-center justify-between px-6 py-6">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-800" />
            <Skeleton className="h-6 w-24 bg-gray-800" />
          </div>
        )}
        <Skeleton className={`h-9 w-9 rounded-xl bg-gray-800 ${isCollapsed ? "mx-auto" : ""}`} />
      </div>

      {/* Navigation Skeleton */}
      <nav className="flex-1 px-3 space-y-4 mt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
          >
            <Skeleton className="h-6 w-6 shrink-0 rounded bg-gray-800" />
            {!isCollapsed && (
              <Skeleton className="h-4 w-full bg-gray-800" />
            )}
          </div>
        ))}
      </nav>

      {/* Logout Skeleton */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-6 w-6 shrink-0 rounded bg-gray-800" />
          {!isCollapsed && (
            <Skeleton className="h-4 w-20 bg-gray-800" />
          )}
        </div>
      </div>
    </aside>
  );
}