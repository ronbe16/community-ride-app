import { COMMUNITY_NAME } from '@/constants/app';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-app mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
            CR
          </div>
          <span className="font-semibold text-sm text-foreground">{COMMUNITY_NAME}</span>
        </div>
        <button className="text-muted-foreground text-sm">
          🔔
        </button>
      </div>
    </header>
  );
}
