import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface InstallGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallGuideDialog({ open, onOpenChange }: InstallGuideDialogProps) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Install Community Ride</DialogTitle>
          <DialogDescription>
            Add to your home screen for quick access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-foreground">
          {isIOS ? (
            <ol className="list-decimal list-inside space-y-2">
              <li>Tap the <strong>Share</strong> button <span className="text-muted-foreground">(square with arrow)</span> in Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-2">
              <li>Tap the <strong>browser menu</strong> <span className="text-muted-foreground">(⋮ three dots)</span></li>
              <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Install"</strong> to confirm</li>
            </ol>
          )}
        </div>
        <Button variant="outline" className="w-full mt-2" onClick={() => onOpenChange(false)}>
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
