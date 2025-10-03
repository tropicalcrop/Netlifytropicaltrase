'use client'

import React from 'react'

export default function ProductionLiquidsLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <div className="flex flex-col gap-6">
            <div>{children}</div>
        </div>
    )
}
