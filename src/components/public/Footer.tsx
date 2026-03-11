import { Dumbbell } from "lucide-react";

export default function Footer() {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-bold">IRONFORGE</span>
        </div>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} IronForge Gym. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
