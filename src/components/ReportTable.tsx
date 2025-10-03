
'use client'

import React from "react"
import Image from "next/image"
import { CheckCircle, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "./ui/scroll-area"

const columnConfig: Record<string, { key: string; label: string }[]> = {
    production: [
        { key: 'lot', label: 'Lote' },
        { key: 'product', label: 'Producto' },
        { key: 'item', label: 'Item' },
        { key: 'status', label: 'Estado' },
        { key: 'date', label: 'Fecha' },
        { key: 'performance', label: 'Rendimiento (%)' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'signature', label: 'Firma Quien Formula' },
    ],
    hygiene: [
        { key: 'area', label: 'Área' },
        { key: 'status', label: 'Estado' },
        { key: 'responsible', label: 'Responsable Limpieza' },
        { key: 'verifier', label: 'Verificador Calidad'},
        { key: 'date', label: 'Fecha' },
        { key: 'lastFabrication', label: 'Última Fabricación' },
        { key: 'signature', label: 'Firma Responsable' },
        { key: 'verificationSignature', label: 'Firma Verificador' },
    ],
    quality_luminometry: [
        { key: 'location', label: 'Ubicación' },
        { key: 'status', label: 'Resultado' },
        { key: 'value', label: 'Valor (URL)' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'date', label: 'Fecha' },
        { key: 'signature', label: 'Firma' },
    ],
    quality_sensory: [
        { key: 'product', label: 'Producto' },
        { key: 'lot', label: 'Lote' },
        { key: 'result', label: 'Resultado Final' },
        { key: 'odor', label: 'Olor'},
        { key: 'color', label: 'Color'},
        { key: 'appearance', label: 'Apariencia'},
        { key: 'responsible', label: 'Responsable' },
        { key: 'date', label: 'Fecha' },
        { key: 'signature', label: 'Firma' },
    ],
    endowment: [
        { key: 'person', label: 'Empleado' },
        { key: 'status', label: 'Resultado' },
        { key: 'items', label: 'Items Verificados' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'date', label: 'Fecha' },
        { key: 'signature', label: 'Firma' },
    ],
    pcc: [
        { key: 'pccId', label: 'PCC' },
        { key: 'meshState', label: 'Estado Malla' },
        { key: 'filterState', label: 'Estado Filtro' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'date', label: 'Fecha' },
        { key: 'signature', label: 'Firma' },
    ],
    scales: [
        { key: 'scale', label: 'Báscula' },
        { key: 'testType', label: 'Tipo de Prueba' },
        { key: 'result', label: 'Resultado' },
        { key: 'readings', label: 'Lecturas' },
        { key: 'responsible', label: 'Responsable' },
        { key: 'date', label: 'Fecha' },
        { key: 'signature', label: 'Firma' },
    ],
    utensils: [
        { key: 'name', label: 'Utensilio' },
        { key: 'entry', label: 'Cantidad Entrada' },
        { key: 'exit', label: 'Cantidad Salida' },
        { key: 'date', label: 'Fecha' },
        { key: 'responsible', label: 'Responsable' },
    ],
    formulations: [
        { key: 'name', label: 'Nombre Formulación' },
        { key: 'item', label: 'Item' },
        { key: 'ingredients', label: 'Nº Ingredientes' },
        { key: 'lastUpdated', label: 'Última Actualización' },
    ],
    users: [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Correo' },
        { key: 'role', label: 'Rol' },
        { key: 'documentType', label: 'Tipo Documento'},
        { key: 'documentNumber', label: 'Número Documento' },
    ],
};


const translateHeader = (header: string) => {
    const spacedHeader = header.replace(/([A-Z])/g, ' $1');
    const translated = spacedHeader.charAt(0).toUpperCase() + spacedHeader.slice(1);
    
    const translations: Record<string, string> = {
        'Pcc Id': 'PCC ID',
        'Mesh State': 'Estado Malla',
        'Filter State': 'Estado Filtro',
        'Mesh In Use': 'Malla en Uso',
        'Filter In Use': 'Filtro en Uso',
        'Start Time': 'Hora Inicio',
        'End Time': 'Hora Fin',
        'Employee Name': 'Nombre Empleado',
        'Employee Id': 'Cédula Empleado',
        'Test Type': 'Tipo de Prueba',
        'Pattern Weight': 'Peso Patrón',
        'Last Updated': 'Última Actualización',
        'Document Type': 'Tipo Documento',
        'Document Number': 'Número Documento',
        'Avatar Url': 'URL Avatar',
        'Last Fabrication': 'Última Fabricación',
        'Mix Type': 'Tipo de Mezcla',
        'Final Product Theoretical Powder': 'Teórico Polvos (kg)',
        'Final Product Theoretical Liquid': 'Teórico Líquidos (kg)',
        'Final Product Real': 'Real (kg)',
        'Packaging Materials': 'Material de Empaque',
        'Supervisor Signature': 'Firma Supervisor',
        'Production Lead Signature': 'Firma Jefe Producción'
    };
    
    return translations[translated] || translated;
}

function DefaultCellRenderer({ data }: { data: any }) {
    if (typeof data === 'boolean') {
        return data ? <CheckCircle className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (typeof data === 'string' && data.startsWith('data:image')) {
        return <Image src={data} alt="Firma o imagen del reporte" width={100} height={50} className="rounded-md bg-white border" />;
    }
    if (typeof data === 'object' && data !== null) {
        if(data.name) return <>{data.name}</>;
        
        return (
            <div className="space-y-1 text-xs font-mono bg-muted/50 p-2 rounded-md max-w-sm">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{translateHeader(key)}:</span>
                        <span className="font-semibold text-foreground">
                            {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return <>{String(data ?? '')}</>;
}


interface ReportTableProps {
    data: any[];
    module: string;
}

export default function ReportTable({ data, module }: ReportTableProps) {
    
    const headers = columnConfig[module] || (data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && !k.toLowerCase().includes('signature') && k !== 'fileBase64' && k !== 'data').map(k => ({key: k, label: translateHeader(k)})) : []);

    return (
        <div className="rounded-md border">
            <ScrollArea className="w-full whitespace-nowrap">
                <Table className="min-w-full table-auto responsive-table">
                    <TableHeader>
                        <TableRow className="sticky top-0 z-10 bg-background shadow-sm">
                            {headers.map(header => (
                                <TableHead key={header.key} className="capitalize">{header.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={index}>
                                {headers.map(header => (
                                    <TableCell key={header.key} className="align-top py-4" data-label={header.label}>
                                         <DefaultCellRenderer data={row[header.key]} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="h-1"></div>
            </ScrollArea>
        </div>
    )
}
