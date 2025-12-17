import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <svg
          viewBox="0 0 48 48"
          className="w-10 h-10 md:w-12 md:h-12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <circle
            cx="24"
            cy="24"
            r="22"
            className="fill-primary"
          />
          
          {/* House/Village Shape */}
          <path
            d="M24 10L10 22V38H18V28H30V38H38V22L24 10Z"
            className="fill-primary-foreground"
          />
          
          {/* Door */}
          <rect
            x="21"
            y="28"
            width="6"
            height="10"
            rx="1"
            className="fill-primary"
          />
          
          {/* Window Left */}
          <rect
            x="13"
            y="24"
            width="4"
            height="4"
            rx="0.5"
            className="fill-primary/80"
          />
          
          {/* Window Right */}
          <rect
            x="31"
            y="24"
            width="4"
            height="4"
            rx="0.5"
            className="fill-primary/80"
          />
          
          {/* Roof Accent */}
          <path
            d="M24 10L10 22H38L24 10Z"
            className="fill-accent"
          />
          
          {/* Chimney */}
          <rect
            x="32"
            y="14"
            width="4"
            height="8"
            rx="0.5"
            className="fill-primary-foreground"
          />
        </svg>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl md:text-3xl font-bold text-gradient leading-none">
            Village
          </span>
          <span className="text-[10px] md:text-xs text-muted-foreground font-medium tracking-wider">
            متجر القرية
          </span>
        </div>
      )}
    </Link>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`w-10 h-10 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="22" className="fill-primary" />
      <path d="M24 10L10 22V38H18V28H30V38H38V22L24 10Z" className="fill-primary-foreground" />
      <rect x="21" y="28" width="6" height="10" rx="1" className="fill-primary" />
      <rect x="13" y="24" width="4" height="4" rx="0.5" className="fill-primary/80" />
      <rect x="31" y="24" width="4" height="4" rx="0.5" className="fill-primary/80" />
      <path d="M24 10L10 22H38L24 10Z" className="fill-accent" />
      <rect x="32" y="14" width="4" height="8" rx="0.5" className="fill-primary-foreground" />
    </svg>
  );
}
