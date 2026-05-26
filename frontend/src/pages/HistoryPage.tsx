import { useEffect, useRef, useCallback } from "react";
import { useInfiniteHistory } from "../hooks/useInfiniteHistory";
import { LogEntryCard } from "../components/LogEntryCard";

function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function HistoryPage() {
  const { groups, loading, error, hasMore, loadMore, isEmpty } =
    useInfiniteHistory();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [handleIntersect]);

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-3 text-4xl">📋</div>
        <h2 className="text-lg font-semibold text-gray-700">No entries yet</h2>
        <p className="mt-1 text-sm text-gray-500">
          Start logging meals, stools, context, or symptoms to see your history
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h1 className="sticky top-0 z-10 bg-gray-50 px-4 py-3 text-lg font-bold text-gray-900">
        History
      </h1>

      <div className="space-y-4 px-4">
        {groups.map((group) => (
          <section key={group.date}>
            <h2 className="mb-2 text-sm font-semibold text-gray-500">
              {formatDateHeading(group.date)}
            </h2>
            <div className="space-y-2">
              {group.entries.map((entry) => (
                <LogEntryCard key={entry.data.id} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {loading && groups.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
