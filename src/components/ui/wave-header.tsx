import type { ReactNode } from 'react';

interface WaveHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  children?: ReactNode; // For additional content like search bars, filters
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function WaveHeader({ title, subtitle, children, icon, className, contentClassName }: WaveHeaderProps) {
  return (
    <div className={`relative text-white shadow-lg ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-red-500 opacity-90"></div>
      <div
        className="absolute bottom-0 left-0 w-full h-20 sm:h-24 md:h-32"
        style={{ transform: 'translateY(1px)' }} // Prevents thin line gap
      >
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* This path creates a wave that fills from bottom. Color matches page background */}
          <path d="M0,70 C360,120 1080,20 1440,70 L1440,100 L0,100 Z" className="fill-background" />
        </svg>
      </div>
      <div className={`relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 ${contentClassName}`}>
        <div className="max-w-4xl mx-auto text-center">
          {icon && <div className="mb-4 inline-block p-3 bg-white/20 rounded-full">{icon}</div>}
          {typeof title === 'string' ? (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            typeof subtitle === 'string' ? (
            <p className="mt-3 sm:mt-4 text-lg sm:text-xl text-primary-foreground/80">
              {subtitle}
            </p>
            ) : (
              subtitle
            )
          )}
          {children && <div className="mt-6 sm:mt-8">{children}</div>}
        </div>
      </div>
    </div>
  );
}
