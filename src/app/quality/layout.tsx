
'use client'

import React from 'react'

export default function QualityLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-6">
            {children}
        </div>
    )
}
