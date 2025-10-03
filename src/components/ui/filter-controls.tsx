

'use client'

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FilterControls({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mb-6"
        >
            <div className="flex items-center justify-end">
                <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        {isOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <Card className="mt-4">
                    <CardContent className="p-4">
                         {children}
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    );
}
