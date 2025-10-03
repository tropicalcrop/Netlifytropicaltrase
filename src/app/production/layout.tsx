'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Beaker,
    Archive,
    FileCog,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const productionTabs = [
    { href: "/production/powders", label: "Lotes de Polvos", icon: Archive },
    { href: "/production/liquids", label: "Lotes de Líquidos", icon: Beaker },
];

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    
    // Determine the active tab based on the current path
    const activeTabValue = productionTabs.find(tab => pathname.startsWith(tab.href))?.href;
    
    const isSubPage = pathname.includes('/finished-product') || pathname.includes('/scales');

    return (
        <div className="flex flex-col gap-6">
            {!isSubPage && (
                <Tabs value={activeTabValue} className="w-full">
                    <TabsList className="w-full flex-col items-stretch justify-start h-auto md:flex-row md:h-10 md:items-center md:justify-start">
                        {productionTabs.map((tab) => (
                            <TabsTrigger key={tab.href} value={tab.href} asChild>
                                <Link href={tab.href}>
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                </Link>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            )}
            <div>{children}</div>
        </div>
    )
}
