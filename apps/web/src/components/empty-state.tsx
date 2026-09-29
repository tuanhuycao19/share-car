import { InboxIcon } from 'lucide-react';

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <InboxIcon className="text-muted-foreground size-8" />
      <p className="font-medium">{title}</p>
      {children && <div className="text-muted-foreground text-sm">{children}</div>}
    </div>
  );
}
