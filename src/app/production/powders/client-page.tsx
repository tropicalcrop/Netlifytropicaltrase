'use client'

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getAll } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Loader2, Search, ChevronRight, Edit } from "lucide-react"
import { useCurrentUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { type ProductionData } from "../page"
import { Input } from "@/components/ui/input"

interface GroupedProduction {
    item: string;
    productName: string;
    lotCount: number;
}


export default function ProductionPowdersClientPage({ initialData }: { initialData: ProductionData[]}) {
    const [data, setData] = useState<ProductionData[]>(initialData)
    const [isLoading, setIsLoading] = useState(true);
    const currentUser = useCurrentUser()
    const router = useRouter()
    
    const [searchTerm, setSearchTerm] = useState("");

    const canCreate = currentUser?.role === 'Administrator';

    useEffect(() => {
        if (currentUser) {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        setData(initialData.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
    }, [initialData]);
    
    const groupedData: GroupedProduction[] = useMemo(() => {
        const groups: { [key: string]: { productName: string, lotCount: number } } = {};

        data.forEach(log => {
            if (log.item && log.type === 'powder') {
                if (!groups[log.item]) {
                    groups[log.item] = { productName: log.product || 'Sin nombre', lotCount: 0 };
                }
                groups[log.item].lotCount++;
            }
        });
        
        return Object.entries(groups).map(([item, { productName, lotCount }]) => ({
            item,
            productName,
            lotCount,
        }));
    }, [data]);
    
    const filteredData = useMemo(() => {
        if (!searchTerm) return groupedData;
        const normalizedSearchTerm = searchTerm.replace(/\s/g, "").toLowerCase();
        return groupedData.filter(group => 
            group.item.replace(/\s/g, "").toLowerCase().includes(normalizedSearchTerm) ||
            group.productName.replace(/\s/g, "").toLowerCase().includes(normalizedSearchTerm)
        );
    }, [searchTerm, groupedData]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <PageHeader title="Productos en Producción (Polvos)" description="Seleccione un producto para ver y gestionar sus lotes.">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en todas las columnas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm pl-10"
                        />
                    </div>
                     {canCreate && (
                        <Button asChild>
                           <Link href="/production/powders/new">
                             <PlusCircle className="mr-2 h-4 w-4" />
                             Registrar Item
                           </Link>
                        </Button>
                    )}
                </div>
            </PageHeader>

            <div className="grid gap-4">
                {filteredData.length > 0 ? (
                    filteredData.map(group => (
                         <Link key={group.item} href={`/production/${group.item}`} className="block">
                            <Card className="hover:bg-muted/50 transition-colors cursor-pointer rounded-xl">
                                <CardContent className="flex items-center justify-between p-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">Item: {group.item}</h3>
                                        <p className="text-muted-foreground">{group.productName} - {group.lotCount} Lote(s)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                </CardContent>
                            </Card>
                         </Link>
                    ))
                ) : (
                     <div className="text-center text-muted-foreground border rounded-lg p-12">
                        <p>No se encontraron productos para la búsqueda "{searchTerm}".</p>
                    </div>
                )}
            </div>
        </>
    )
}
