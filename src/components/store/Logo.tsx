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
          {/* Background Shape - Modern rounded square */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            className="fill-primary"
          />
          
          {/* Letter V stylized */}
          <path
            d="M14 14L24 34L34 14"
            className="stroke-primary-foreground"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Small house icon on top of V */}
          <path
            d="M24 8L18 13H30L24 8Z"
            className="fill-accent"
          />
          <rect
            x="21"
            y="13"
            width="6"
            height="5"
            className="fill-primary-foreground"
          />
          
          {/* Decorative dots */}
          <circle cx="10" cy="38" r="2" className="fill-accent" />
          <circle cx="38" cy="38" r="2" className="fill-accent" />
        </svg>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-none tracking-tight">
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
      <rect x="2" y="2" width="44" height="44" rx="12" className="fill-primary" />
      <path
        d="M14 14L24 34L34 14"
        className="stroke-primary-foreground"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M24 8L18 13H30L24 8Z" className="fill-accent" />
      <rect x="21" y="13" width="6" height="5" className="fill-primary-foreground" />
      <circle cx="10" cy="38" r="2" className="fill-accent" />
      <circle cx="38" cy="38" r="2" className="fill-accent" />
    </svg>
  );
}
