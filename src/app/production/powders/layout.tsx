'use client'

import React from 'react'

export default function ProductionPowdersLayout({ children }: { children: React.ReactNode }) {
    
    return (
        <div className="flex flex-col gap-6">
            <div>{children}</div>
        </div>
    )
}
