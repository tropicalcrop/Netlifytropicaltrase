'use client'

import React, { useState, useMemo, useEffect } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, remove, getAll } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, ChevronsUpDown, Loader2, Clock, Eye, Search } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/context/UserContext"
import { type ProductionData } from '../production/page'
import { type QualityData, type QualityFormType } from './types'
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from 'next/link'
import { type UserData } from "../users/page"
import { useRouter } from "next/navigation"
import { sendNotification } from "@/services/notificationService"

interface QualityClientPageProps {
    initialData: QualityData[];
    pageTitle: string;
    pageDescription: string;
    formType: QualityFormType;
    collectionName: string;
    productionData?: ProductionData[];
    usersData?: UserData[];
    subType?: 'powders' | 'liquids';
    luminometryType?: 'powders' | 'liquids';
}

export default function QualityGenericClientPage({ 
    initialData, 
    pageTitle, 
    pageDescription, 
    formType,
    collectionName,
    luminometryType,
}: QualityClientPageProps) {
    const [data, setData] = useState<QualityData[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast()
    const currentUser = useCurrentUser()
    const router = useRouter()
    
    const [rowSelection, setRowSelection] = useState({})
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState('')

    const canCreate = currentUser?.role === 'Administrator' || currentUser?.role === 'Production' || currentUser?.role === 'Quality';
    const canEdit = currentUser?.role === 'Administrator' || currentUser?.role === 'Quality';
    const canDelete = currentUser?.role === 'Administrator';
    const canChangeStatus = currentUser?.role === 'Administrator' || currentUser?.role === 'Quality';
    
    const basePath = useMemo(() => {
      const pccForms = ['endowment', 'pcc', 'utensils', 'magnet-inspection', 'pcc-final-inspection'];
      if (pccForms.includes(formType)) return '/pcc';
      
      const qualityFormsWithSubfolders = [
        'scales', 'scales-liquids', 'in-process', 'in-process-liquids',
        'luminometry', 'luminometry-liquids', 'area-clearance-powders', 'area-clearance-liquids', 'hygiene', 'hygiene_liquids'
      ];
      if(qualityFormsWithSubfolders.includes(formType)) return '/quality';

      return '/quality';

    }, [formType]);
    
    const formPathSegment = useMemo(() => {
        if (formType === 'scales') return `scales/powders`;
        if (formType === 'scales-liquids') return `scales/liquids`;
        if (formType === 'in-process') return `in-process/powders`;
        if (formType === 'in-process-liquids') return `in-process/liquids`;
        if (formType === 'luminometry') return `luminometry/powders`;
        if (formType === 'luminometry-liquids') return `luminometry/liquids`;
        if (formType === 'area-clearance-powders') return `area-clearance/powders`;
        if (formType === 'area-clearance-liquids') return `area-clearance/liquids`;
        if (formType === 'hygiene') return `hygiene/powders`;
        if (formType === 'hygiene_liquids') return `hygiene/liquids`;
        if (formType === 'pcc') return 'inspection';
        if (formType === 'pcc-final-inspection') return 'final-inspection';
        
        return formType;
    }, [formType]);


    useEffect(() => {
        setData(initialData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, [initialData]);

    const handleSave = async (logData: QualityData) => {
        try {
            await addOrUpdate(collectionName, logData)
            const updatedData = await getAll<QualityData>(collectionName);
            setData(updatedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            toast({ title: "Éxito", description: `Registro de calidad guardado.` })
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro." })
        }
    }
    
    const handleStatusChange = async (log: QualityData, newStatus: string) => {
        if (!canChangeStatus || !currentUser) return;

        const updatedLog: QualityData = { ...log, status: newStatus, result: newStatus };
        await handleSave(updatedLog);

        if (formType === 'attribute-release' && newStatus === 'Aprobado') {
            await sendNotification({
                title: 'Ciclo de Fabricación Completado',
                message: `Todos los controles de calidad han sido aprobados. El ciclo de producción para el lote ${log.lot} ha finalizado.`,
                senderId: currentUser.id as string,
                senderName: 'Sistema',
                recipient: 'Administrator',
                link: '/quality'
            });
        }
    };

    const handleDelete = async (ids: string[]) => {
        try {
            await Promise.all(ids.map(id => remove(collectionName, id)))
            setData(prev => prev.filter(item => !ids.includes(item.id)))
            table.resetRowSelection()
            toast({
                title: "Éxito",
                description: `${ids.length} registro(s) eliminado(s) correctamente.`
            })
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron eliminar los registros." })
        }
    }
    
    const columns: ColumnDef<QualityData>[] = useMemo(() => {
        const baseColumns: ColumnDef<QualityData>[] = [
             ...(canDelete ? [{
                id: "select",
                header: ({ table }) => (<div className="flex h-full items-center"><Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" /></div>),
                cell: ({ row }) => (<div className="flex h-full items-center"><Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" /></div>),
                enableSorting: false,
                enableHiding: false,
            }] : []),
            {
                accessorKey: "date",
                header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Fecha <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>,
            },
            {
                accessorKey: "responsible.name",
                header: "Responsable",
                cell: ({ row }) => (
                    <div>
                        <div>{row.original.responsible?.name}</div>
                        <div className="text-xs text-muted-foreground">{row.original.responsible?.role}</div>
                    </div>
                )
            },
            {
                accessorKey: "status",
                header: "Estado/Resultado",
                cell: ({row}) => {
                    const value = row.original.status || row.original.result || 'N/A';
                    const isBad = ['Falla', 'No Conforme', 'Rechazado', 'Retenido'].includes(value);
                    const isGood = ['Pasa', 'Conforme', 'Aprobado', 'Verificado', 'Aprobado para Envasar', 'Cumple'].includes(value);
                    
                    const statusOptions: Record<string, string[]> = {
                        'luminometry': ['Pasa', 'Falla'],
                        'luminometry-liquids': ['Pasa', 'Falla'],
                        'sensory': ['Aprobado', 'Rechazado'],
                        'in-process': ['Conforme', 'No Conforme'],
                        'in-process-liquids': ['Cumple', 'No Cumple'],
                        'finished-product': ['Aprobado para Envasar', 'Retenido'],
                        'endowment': ['Conforme', 'No Conforme'],
                        'pcc': ['Conforme', 'No Conforme'],
                        'pcc-final-inspection': ['Conforme', 'No Conforme'],
                        'scales': ['Cumple', 'No Cumple'],
                        'scales-liquids': ['Cumple', 'No Cumple'],
                        'utensils': ['Conforme', 'No Conforme'],
                        'magnet-inspection': ['Conforme', 'No Conforme'],
                        'attribute-release': ['Aprobado', 'Rechazado'],
                        'weighing': ['Conforme', 'No Conforme'],
                        'temp-humidity': ['Conforme', 'No Conforme'],
                        'area-clearance-powders': ['Conforme', 'No Conforme'],
                        'area-clearance-liquids': ['Conforme', 'No Conforme'],
                        'hygiene': ['Verificado', 'Pendiente'],
                        'hygiene_liquids': ['Verificado', 'Pendiente'],
                    };

                    const options = statusOptions[formType] || [];
                    
                    const StatusBadge = (
                        <Badge variant={isBad ? "destructive" : isGood ? "default" : "secondary"} className="capitalize">
                             {isBad ? <XCircle className="mr-2 h-4 w-4" /> : isGood ? <CheckCircle className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                            {value}
                            {canChangeStatus && options.length > 0 && <span className="ml-1.5 -mr-0.5 inline-block h-2 w-2 i-lucide-chevrons-up-down" />}
                        </Badge>
                    );

                    if (canChangeStatus && options.length > 0) {
                        return (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" className="h-auto p-0">{StatusBadge}</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {options.map(option => (
                                        <DropdownMenuItem key={option} onClick={() => handleStatusChange(row.original, option)}>
                                            {option}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }

                    return StatusBadge;
                }
            },
            {
                id: "actions",
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`${basePath}/${formPathSegment}/${row.original.id}/edit?preview=true`}>
                                <Eye className="h-4 w-4" />
                            </Link>
                        </Button>
                        {canEdit && (
                            <Button variant="ghost" size="icon" asChild>
                               <Link href={`${basePath}/${formPathSegment}/${row.original.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                               </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción es permanente y eliminará este registro de calidad.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete([row.original.id])}>Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                ),
            },
        ];

        let specificColumns: ColumnDef<QualityData>[] = [];
        switch(formType) {
            case 'luminometry':
            case 'luminometry-liquids': 
                specificColumns = []; break;
            case 'sensory': specificColumns = [{ accessorKey: "product", header: "Producto" }, { accessorKey: "lot", header: "Lote" }]; break;
            case 'in-process': specificColumns = [{ accessorKey: "product", header: "Producto" }, { accessorKey: "lot", header: "Lote" }, { accessorKey: "humidity", header: "% Humedad" }]; break;
            case 'in-process-liquids': specificColumns = [{ accessorKey: "product", header: "Producto" }, { accessorKey: "lot", header: "Lote" }, { accessorKey: "inProcessAppearance", header: "Apariencia" }]; break;
            case 'finished-product': specificColumns = [{ accessorKey: "lot", header: "Lote" }]; break;
            case 'endowment': specificColumns = [{ accessorKey: "personnelNames", header: "Personal Revisado" }]; break;
            case 'pcc': specificColumns = [{ accessorKey: "mixingTankId", header: "Tanque Mezcla" }]; break;
            case 'pcc-final-inspection': specificColumns = [{ accessorKey: "lot", header: "Lote" }, { accessorKey: "gramsRetained", header: "Gramos Retenidos" }]; break;
            case 'scales': 
            case 'scales-liquids':
                specificColumns = [ { accessorKey: "equipmentDetails.0.equipment", header: "Equipo" } ]; break;
            case 'utensils': specificColumns = [{ accessorKey: "name", header: "Utensilio" }, { accessorKey: "entry", header: "Entrada" }, { accessorKey: "exit", header: "Salida" }]; break;
            case 'magnet-inspection': specificColumns = []; break;
            case 'attribute-release': specificColumns = [{ accessorKey: "lot", header: "Lote" }]; break;
            case 'weighing': specificColumns = [{ accessorKey: "product", header: "Producto" }, { accessorKey: "lot", header: "Lote" }]; break;
            case 'temp-humidity': specificColumns = [{accessorKey: "temperature", header: "Temperatura"}, {accessorKey: "humidity", header: "Humedad"}]; break;
            case 'area-clearance-powders': specificColumns = []; break;
            case 'area-clearance-liquids': specificColumns = []; break;
            case 'hygiene':
            case 'hygiene_liquids':
                specificColumns = [{ accessorKey: "product", header: "Producto" }, { accessorKey: "lot", header: "Lote" }]; break;
        }

        const reorderedColumns = [...specificColumns, ...baseColumns.filter(c => c.id !== 'select' && c.id !== 'actions'), ...baseColumns.filter(c => c.id === 'actions')]
        if (canDelete) {
            reorderedColumns.unshift(baseColumns.find(c => c.id === 'select')!)
        }
        return reorderedColumns;
    }, [formType, canEdit, canDelete, canChangeStatus, basePath, formPathSegment]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: { 
            sorting, 
            rowSelection,
            globalFilter,
        },
        initialState: { pagination: { pageSize: 10 } }
    })

     if (isLoading) {
        return (<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
    }
    
    return (
        <>
            <PageHeader title={pageTitle} description={pageDescription}>
                 {canCreate && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {canDelete && table.getFilteredSelectedRowModel().rows.length > 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar ({table.getFilteredSelectedRowModel().rows.length})</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente y eliminará los registros seleccionados.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(table.getSelectedRowModel().rows.map(r => r.original.id))}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <Button asChild>
                           <Link href={`${basePath}/${formPathSegment}/new`}>
                             <PlusCircle className="mr-2 h-4 w-4" />Añadir Prueba
                           </Link>
                        </Button>
                    </div>
                )}
            </PageHeader>

             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filtrar en todas las columnas..."
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm pl-10"
                />
            </div>

            <div className="rounded-md border">
                <Table className="responsive-table">
                    <TableHeader>{table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}</TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (<TableCell key={cell.id} data-label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No se encontraron resultados.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).</div>
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
            </div>
        </>
    )
}
