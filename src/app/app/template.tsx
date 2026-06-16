export default function AppTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col duration-200 animate-in fade-in-0">
      {children}
    </div>
  )
}
