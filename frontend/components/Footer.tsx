import { Github, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-secondary/20 py-10 pl-2">
      <div className="container mx-auto px-4 sm:px-6 max-w-[1200px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">
              Maintainer
            </span>
          </div>
          <div className="flex gap-16 text-sm text-muted-foreground">
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Odoo Maintainer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
