export default function Loading() {
  return (
    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
      <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Laster…
    </div>
  );
}
