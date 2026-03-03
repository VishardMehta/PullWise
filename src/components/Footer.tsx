import { Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 mt-12">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="bg-white/[0.02] backdrop-blur-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-3 text-white/40 text-sm">
            <span>© {new Date().getFullYear()} PullWise</span>
            <span className="text-white/10">·</span>
            <a
              href="https://github.com/VishardMehta/PullWise"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white/60 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              Open Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
