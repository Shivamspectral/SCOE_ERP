export default function CampusLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">Loading</span>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />)}
      </div>
    </div>
  )
}
