
'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Beaker,
    FlaskConical,
} from "lucide-react"
import { useCurrentUser } from '@/context/UserContext'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const qualityTabs = [
    { href: "/luminometry/powders", label: "Polvos", icon: Beaker },
    { href: "/luminometry/liquids", label: "Líquidos", icon: FlaskConical },
];

export default function LuminometryLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const currentUser = useCurrentUser();

    // Determina el valor activo de la pestaña a partir de la ruta
    const activeTabValue = qualityTabs.find(tab => pathname.startsWith(tab.href))?.href;

    return (
        <div className="flex flex-col gap-6">
            <Tabs value={activeTabValue} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:w-fit">
                    {qualityTabs.map((tab) => (
                        <Link key={tab.href} href={`${tab.href}`} passHref>
                            <TabsTrigger value={tab.href} asChild>
                                <div>
                                   <tab.icon className="mr-2 h-4 w-4" />
                                   {tab.label}
                                </div>
                            </TabsTrigger>
                        </Link>
                    ))}
                </TabsList>
            </Tabs>

            <div>{children}</div>
        </div>
    )
}
