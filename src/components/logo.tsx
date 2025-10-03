
'use client';

import { cn } from '@/lib/utils'

export function Logo({ className, animated }: { className?: string, animated?: boolean }) {
  return (
    <div className={cn("relative w-[300px] h-[60px]", className)}>
      {/* Light mode logo */}
      <svg width="300" height="60" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg" className="block dark:hidden">
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
            `}
          </style>
        </defs>
        <text 
          x="50%" y="35" 
          textAnchor="middle"
          fontFamily="'Dancing Script', cursive" 
          fontSize="38" 
          fontWeight="700" 
          fill="#27ae60"
          className={cn(animated && "animate-logo-fill")}
        >
          Tropical Trace
        </text>
        <text x="50%" y="55" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="12" fontWeight="500" fill="#6b7280">
          Ingeniería para Crear Alimentos
        </text>
      </svg>
      {/* Dark mode logo */}
      <svg width="300" height="60" viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg" className="hidden dark:block">
         <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
            `}
          </style>
        </defs>
        <text 
          x="50%" y="35" 
          textAnchor="middle"
          fontFamily="'Dancing Script', cursive" 
          fontSize="38" 
          fontWeight="700" 
          fill="white"
          className={cn(animated && "animate-logo-fill")}
        >
          Tropical Trace
        </text>
        <text x="50%" y="55" textAnchor="middle" fontFamily="'Inter', sans-serif" fontSize="12" fontWeight="500" fill="#d1d5db">
          Ingeniería para Crear Alimentos
        </text>
      </svg>
    </div>
  )
}
