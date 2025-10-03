'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Beaker,
    Archive
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const formulationTabs = [
    { href: "/formulations/powders", label: "Polvos", icon: Archive },
    { href: "/formulations/liquids", label: "Líquidos", icon: Beaker },
];

export default function FormulationsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isSubPage, setIsSubPage] = useState(false);

    useEffect(() => {
        const segments = pathname.split('/').filter(Boolean);
        setIsSubPage(segments.length > 2);
    }, [pathname]);

    const activeTabValue = formulationTabs.find(tab => pathname.startsWith(tab.href))?.href;

    return (
        <div className="flex flex-col gap-6">
            {!isSubPage && (
                <Tabs value={activeTabValue} className="w-full">
                    <TabsList className="w-full flex-col items-stretch justify-start h-auto md:flex-row md:h-10 md:items-center md:justify-start">
                        {formulationTabs.map((tab) => (
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
