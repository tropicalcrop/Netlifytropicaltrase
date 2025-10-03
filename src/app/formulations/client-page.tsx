

'use client'
import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Beaker, Apple, FileUp, FileSpreadsheet, Download, Edit, Trash2, Calculator, Factory, Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import * as XLSX from 'xlsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { addOrUpdate, remove } from '@/services/firestoreService'
import { useToast } from "@/hooks/use-toast"
import { type ProductionData } from '../production/page'
import Link from 'next/link'
import { useCurrentUser } from "@/context/UserContext"

const FORMULATION_COLLECTION_NAME = "formulations";

export interface Formulation {
    id: string;
    item: string; // Unique Product Identifier
    name: string;
    ingredients: number;
    lastUpdated: string;
    fileName: string;
    fileBase64?: string;
    fileType?: string;
    data: string; // JSON string of the excel data
    isInitial: boolean;
}

const BeefIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17h0a2.5 2.5 0 0 0 2.5-2.5V12h-5v2.5Z"/><path d="M15 12v2.5A2.5 2.5 0 0 0 17.5 17h0a2.5 2.5 0 0 0 2.5-2.5V12h-5Z"/><path d="M6 12v-2.5A2.5 2.5 0 0 1 8.5 7h0a2.5 2.5 0 0 1 2.5 2.5V12H6Z"/><path d="M12.5 12V9.5A2.5 2.5 0 0 1 15 7h0a2.5 2.5 0 0 1 2.5 2.5V12h-5Z"/><path d="M20.5 12.5c0-1.2-4-1.2-4.5 0v-1c0-1.2 4-1.2-4.5 0"/><path d="M3.5 12.5c0-1.2 4-1.2-4.5 0v-1c0-1.2-4-1.2-4.5 0"/></svg>
)

const iconMap: Record<string, React.ElementType> = {
    '1': BeefIcon,
    '2': Apple,
    '3': Beaker,
    '4': Beaker
};

function FormulationDetailDialog({ formulation, onDownload, onClose }: { formulation: Formulation, onDownload: () => void, onClose: () => void }) {
    const tableData = useMemo(() => {
        try {
            const parsedData = JSON.parse(formulation.data || '[]');
            return Array.isArray(parsedData) ? parsedData : [];
        } catch (e) {
            console.error("Failed to parse formulation data:", e);
            return [];
        }
    }, [formulation.data]);

    const headerRow = tableData.length > 3 ? tableData[3] : [];
    const bodyRows = tableData.length > 4 ? tableData.slice(4) : [];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl p-0 flex flex-col h-full max-h-[90vh]">
                <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-20">
                    <DialogTitle>Detalles de Formulación: {formulation.name}</DialogTitle>
                    <DialogDescription>
                        Visualizando el contenido del archivo: <span className="font-semibold">{formulation.fileName || 'N/A'}</span>. Item: <span className="font-semibold">{formulation.item}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                    <div className="p-6">
                        <Table className="relative border-collapse w-full border">
                            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                                <TableRow>
                                    {headerRow.map((header, index) => (
                                        <TableHead key={index} className="border p-2 font-bold whitespace-nowrap sticky top-0 bg-muted/90">{header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bodyRows.map((row, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {row.map((cell, cellIndex) => (
                                            <TableCell key={cellIndex} className="border p-2 whitespace-nowrap">{cell}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter className="p-4 border-t flex-col sm:flex-row sm:justify-end gap-2 sticky bottom-0 bg-background z-20">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cerrar</Button>
                    <Button onClick={onDownload} className="w-full sm:w-auto" disabled={!formulation.fileBase64}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Archivo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    if (!dataurl) return null;
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


export default function FormulationsClientPage({ initialData }: { initialData: Formulation[] }) {
    const router = useRouter()
    const { toast } = useToast()
    const currentUser = useCurrentUser()
    
    const [formulations, setFormulations] = useState(initialData)
    const [selectedFormulation, setSelectedFormulation] = useState<Formulation | null>(null)
    
    const canManage = currentUser?.role === 'Administrator' || currentUser?.role === 'Production';

    useEffect(() => {
        setFormulations(initialData);
    }, [initialData]);
    
    const handleDownload = () => {
        if (selectedFormulation && selectedFormulation.fileBase64 && selectedFormulation.fileName) {
            const file = dataURLtoFile(selectedFormulation.fileBase64, selectedFormulation.fileName);
            if (file) {
                const url = URL.createObjectURL(file)
                const a = document.createElement('a')
                a.href = url
                a.download = selectedFormulation.fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await remove(FORMULATION_COLLECTION_NAME, id);
            setFormulations(formulations.filter(f => f.id !== id));
            toast({ title: "Éxito", description: `Formulación eliminada.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la formulación." });
        }
    }

    const getIconForFormulation = (formulation: Formulation) => {
        if (formulation.isInitial && formulation.id in iconMap) {
            return iconMap[formulation.id];
        }
        return FileSpreadsheet;
    }

  return (
    <>
      <PageHeader
        title="Formulaciones de Productos"
        description="Gestionar las plantillas de ingredientes e iniciar la fabricación."
      >
        {canManage && (
            <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/production/powders/new?from=formulations">
                    <Calculator className="mr-2 h-4 w-4" />
                    Distribuir Producción
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/formulations/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear Formulación
                  </Link>
                </Button>
            </div>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {formulations.map((item) => {
            const IconComponent = getIconForFormulation(item);
            return (
            <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow rounded-xl">
                <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex-shrink-0">
                        <div className="p-3 bg-muted rounded-full">
                           <IconComponent className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <CardTitle className="truncate">{item.name}</CardTitle>
                        <CardDescription className="truncate">Item: {item.item} - {item.ingredients} Ingredientes</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">Última actualización: {item.lastUpdated}</p>
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-2">
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => setSelectedFormulation(item)}
                            disabled={!item.data}
                        >
                            Ver Detalles
                        </Button>
                         {canManage && (
                            <>
                                <Button variant="secondary" size="icon" asChild>
                                    <Link href={`/formulations/${item.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción es permanente. Se eliminará la formulación "{item.name}".
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </CardFooter>
            </Card>
        )})}
      </div>
      
      {selectedFormulation && (
          <FormulationDetailDialog 
              formulation={selectedFormulation}
              onDownload={handleDownload}
              onClose={() => setSelectedFormulation(null)}
          />
      )}
    </>
  )
}
