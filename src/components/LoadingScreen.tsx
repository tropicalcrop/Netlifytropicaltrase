'use client';

import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';

export function LoadingScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 200); 

    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-2">
        <Logo animated={true} className="w-[350px] h-[70px]" />
      </div>
    </div>
  );
}
