import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm mt-12">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
          <span>© {new Date().getFullYear()} PullWise Team</span>
          <span>•</span>
          <a
            href="https://github.com/VishardMehta/PullWise"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Github className="h-4 w-4" />
            Open Source
          </a>
        </div>
      </div>
    </footer>
  );
}
