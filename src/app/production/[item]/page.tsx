'use client'

import React, { useState, useMemo, useEffect, useCallback } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, remove, getAll } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Edit, Trash2, ChevronsUpDown, Loader2, ArrowLeft, Eye, XCircle, Search, ArrowUp, ArrowDown, Save } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useRouter, useParams } from "next/navigation"
import { useCurrentUser } from "@/context/UserContext"
import { type Formulation } from "../../formulations/client-page"
import Link from 'next/link'
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock } from "lucide-react"
import { type ProductionData } from "../page"
import { sendSystemNotification } from "@/services/notificationService"

const COLLECTION_NAME = "production"

export default function ProductionItemDetailPage() {
    const params = useParams();
    const item = params.item as string;
    const [allLogs, setAllLogs] = useState<ProductionData[]>([]);
    const [formulations, setFormulations] = useState<Formulation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast, dismiss } = useToast();
    const currentUser = useCurrentUser();
    const router = useRouter();
    
    const [rowSelection, setRowSelection] = useState({});
    const [orderedSelection, setOrderedSelection] = useState<string[]>([]);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'productionOrder', desc: false }]);
    const [globalFilter, setGlobalFilter] = useState('');

    const canManageQueue = currentUser?.role === 'Administrator';
    const canCreate = currentUser?.role === 'Administrator';
    const canEdit = currentUser?.role === 'Administrator';
    const canVerify = currentUser?.role === 'Administrator' || currentUser?.role === 'Quality';
    const canDelete = currentUser?.role === 'Administrator';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const productionData = await getAll<ProductionData>('production');
            const formulationsData = await getAll<Formulation>('formulations');
            setAllLogs(productionData);
            setFormulations(formulationsData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const itemLogs = useMemo(() => {
        return allLogs.filter(log => log.item === item);
    }, [allLogs, item]);
    
    const productInfo = useMemo(() => {
        if (itemLogs.length > 0) {
            return { name: itemLogs[0].product, type: itemLogs[0].type };
        }
        const formulation = formulations.find(f => f.item === item);
        if (formulation) {
            const type = formulation.name.toLowerCase().includes('líquido') ? 'liquid' : 'powder';
            return { name: formulation.name, type: type };
        }
        return { name: 'Producto Desconocido', type: 'powder' };
    }, [itemLogs, formulations, item]);


    const handleSave = async (logData: ProductionData) => {
        try {
            await addOrUpdate(COLLECTION_NAME, logData);
            const updatedData = await getAll<ProductionData>(COLLECTION_NAME);
            setAllLogs(updatedData);
            toast({ title: "Éxito", description: `Lote de producción "${logData.lot}" guardado.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el lote de producción." });
        }
    };
    
    const handleStatusChange = async (log: ProductionData, newStatus: string) => {
        if (!canVerify) return;
        const updatedLog: ProductionData = { ...log, status: newStatus as ProductionData['status'] };
        await handleSave(updatedLog);

        if (newStatus === 'Completado') {
            const sortedQueue = itemLogs
                .filter(l => l.status !== 'Completado' || l.id === log.id)
                .sort((a,b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity));

            const currentIndex = sortedQueue.findIndex(l => l.id === log.id);
            if (currentIndex !== -1 && currentIndex + 1 < sortedQueue.length) {
                const nextLot = sortedQueue[currentIndex + 1];
                await sendSystemNotification({
                    title: 'Siguiente Lote en Cola',
                    message: `La fabricación del lote ${log.lot} ha terminado. El siguiente en la cola es el lote ${nextLot.lot} - ${nextLot.product}.`,
                    recipient: 'Production',
                    link: `/production/${nextLot.item}`
                });
            }
        }
    };

    const handleDelete = async (ids: string[]) => {
        try {
            await Promise.all(ids.map(id => remove(COLLECTION_NAME, id)));
            const updatedData = await getAll<ProductionData>(COLLECTION_NAME);
            setAllLogs(updatedData);
            table.resetRowSelection();
            toast({
                title: "Éxito",
                description: `${ids.length} lote(s) eliminado(s) correctamente.`
            });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron eliminar los lotes." });
        }
    };

    const handleSelectionOrderChange = useCallback((rowId: string) => {
        setOrderedSelection(prev => {
            if (prev.includes(rowId)) {
                return prev.filter(id => id !== rowId);
            } else {
                return [...prev, rowId];
            }
        });
    }, []);

    const handleSaveOrder = async () => {
        if (orderedSelection.length === 0) return;
        setIsLoading(true);
        try {
            const batchUpdatePromises = orderedSelection.map((logId, index) => {
                const logToUpdate = allLogs.find(l => l.id === logId);
                if (logToUpdate) {
                    return addOrUpdate(COLLECTION_NAME, { ...logToUpdate, productionOrder: index + 1 });
                }
                return Promise.resolve();
            });

            await Promise.all(batchUpdatePromises);
            const updatedData = await getAll<ProductionData>(COLLECTION_NAME);
            setAllLogs(updatedData);
            setOrderedSelection([]);
            table.resetRowSelection();
            toast({ title: "Éxito", description: "Orden de producción guardado." });

        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el orden." });
        } finally {
            setIsLoading(false);
        }
    };

    const getFormUrl = (log?: ProductionData | null, action: 'edit' | 'new' | 'preview' = 'edit') => {
        const type = log?.type || productInfo.type;
        const base = `/production/${type === 'liquid' ? 'liquids' : 'powders'}`;

        if (action === 'new') {
            const latestLogId = itemLogs[0]?.id;
            const cloneParam = latestLogId ? `?cloneFrom=${latestLogId}` : '';
            return `${base}/new${cloneParam}`;
        }
        
        const actionPath = log ? `/${log.id}/edit` : '/new';
        const params = action === 'preview' ? '?preview=true' : '';
        return `${base}${actionPath}${params}`;
    };


    const columns: ColumnDef<ProductionData>[] = useMemo(() => [
         {
            id: "select",
            header: ({ table }) => (<div className="flex h-full items-center"><Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => {
                table.toggleAllPageRowsSelected(!!value);
                const allRowIds = table.getRowModel().rows.map(r => r.original.id);
                setOrderedSelection(value ? allRowIds : []);
            }} aria-label="Select all" /></div>),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => {
                        row.toggleSelected(!!value);
                        handleSelectionOrderChange(row.original.id);
                    }} aria-label="Select row" />
                    {orderedSelection.includes(row.original.id) && (
                        <span className="text-xs font-bold text-primary">
                            {orderedSelection.indexOf(row.original.id) + 1}
                        </span>
                    )}
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "productionOrder",
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Orden <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs p-1.5 bg-muted rounded-md">{row.original.productionOrder ?? 'N/A'}</span>
                </div>
            )
        },
        {
            accessorKey: "lot",
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Lote <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>,
            cell: ({ row }) => (
                <Link href={getFormUrl(row.original, 'preview')} className="font-medium cursor-pointer hover:underline">
                    {row.original.lot}
                </Link>
            )
        },
        { 
            accessorKey: "status", 
            header: "Estado", 
            cell: ({ row }) => {
                const status = row.original.status || 'Pendiente';
                const statusOptions = ['Pendiente', 'En Progreso', 'Completado'];

                const StatusBadge = (
                    <Badge variant={status === 'Completado' ? 'default' : status === 'En Progreso' ? 'secondary' : 'outline'} className="capitalize">
                        {status === 'Completado' ? <CheckCircle className="mr-2 h-4 w-4"/> : <Clock className="mr-2 h-4 w-4"/>}
                        {status}
                        {canVerify && <span className="ml-1.5 -mr-0.5 inline-block h-2 w-2 i-lucide-chevrons-up-down" />}
                    </Badge>
                );

                if (canVerify) {
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" className="h-auto p-0">{StatusBadge}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {statusOptions.map(option => (
                                    <DropdownMenuItem key={option} onSelect={() => handleStatusChange(row.original, option)}>
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
        { accessorKey: "date", header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Fecha <ChevronsUpDown className="ml-2 h-4 w-4" /></Button>, cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'dd/MM/yyyy') : 'N/A' },
        { accessorKey: "performance", header: "Rendimiento", cell: ({ row }) => `${row.original.performance?.toFixed(2) || '0.00'}%` },
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
            id: "actions", 
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={getFormUrl(row.original, 'preview')}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    {canEdit && (
                         <Button variant="ghost" size="icon" asChild>
                           <Link href={getFormUrl(row.original)}><Edit className="h-4 w-4" /></Link>
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
                                        Esta acción es permanente y eliminará el lote "{row.original.lot}".
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
        }
    ].filter(Boolean) as ColumnDef<ProductionData>[], [canEdit, canVerify, canDelete, router, productInfo.type, canManageQueue, itemLogs, handleSelectionOrderChange, orderedSelection]);

    const table = useReactTable({
        data: itemLogs,
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
    });
    
    const backLink = productInfo.type === 'liquid' ? '/production/liquids' : '/production/powders';

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
     return (
        <>
            <PageHeader 
                title={`Lotes para: ${productInfo.name}`}
                description={`Item: ${item}`}
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                     <Button variant="outline" asChild>
                        <Link href={backLink}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    {(canManageQueue && orderedSelection.length > 0) && (
                        <Button onClick={handleSaveOrder} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar Orden ({orderedSelection.length})
                        </Button>
                    )}
                    {canCreate && (
                        <>
                            {canDelete && table.getFilteredSelectedRowModel().rows.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar ({table.getFilteredSelectedRowModel().rows.length})</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción es permanente y eliminará los lotes seleccionados.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(table.getSelectedRowModel().rows.map(r => r.original.id))}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            <Button asChild>
                                <Link href={getFormUrl(null, 'new')}>
                                    <PlusCircle className="mr-2 h-4 w-4" />Crear Lote
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>
            
            {canManageQueue && (
                <div className="p-3 mb-4 text-sm text-primary-foreground bg-primary/90 rounded-md">
                    <p><strong>Modo de Ordenamiento:</strong> Selecciona las casillas en el orden en que deseas fabricar los lotes y luego haz clic en "Guardar Orden".</p>
                </div>
            )}


            <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filtrar en todas las columnas..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm pl-10"
                />
            </div>

            <div className="rounded-md border">
                <Table className="responsive-table">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (<TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>{row.getVisibleCells().map((cell) => (<TableCell key={cell.id} data-label={typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}</TableRow>))
                        ) : (<TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No se encontraron lotes para este producto.</TableCell></TableRow>)}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).</div>
                <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</Button>
            </div>
        </>
    );
}
