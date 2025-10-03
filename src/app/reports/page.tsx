'use client'

import React, { useState } from 'react';
import { getAll } from '@/services/firestoreService';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Download, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type UserData } from '../users/page';
import ReportTable from '@/components/ReportTable';
import * as XLSX from 'xlsx';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const reportableModules = [
    { value: 'production', label: 'Producción' },
    { value: 'users', label: 'Usuarios' },
    { value: 'hygiene', label: 'Higiene (Polvos)' },
    { value: 'hygiene_liquids', label: 'Higiene (Líquidos)' },
    { value: 'quality_luminometry', label: 'Calidad - Luminometría (Polvos)' },
    { value: 'quality_luminometry_liquids', label: 'Calidad - Luminometría (Líquidos)' },
    { value: 'quality_area_clearance_powders', label: 'Calidad - Despeje Área (Polvos)' },
    { value: 'quality_area_clearance_liquids', label: 'Calidad - Despeje Área (Líquidos)' },
    { value: 'scales', label: 'Calidad - Básculas (Polvos)' },
    { value: 'scales-liquids', label: 'Calidad - Básculas (Líquidos)' },
    { value: 'quality_in_process', label: 'Calidad - En Proceso (Polvos)' },
    { value: 'quality_in_process_liquids', label: 'Calidad - En Proceso (Líquidos)' },
    { value: 'quality_finished_product', label: 'Calidad - Producto Terminado' },
    { value: 'quality_attribute_release', label: 'Calidad - Liberación Atributos' },
    { value: 'weighing', label: 'Calidad - Pesaje' },
    { value: 'quality_temp_humidity', label: 'Calidad - Temp. y Humedad' },
    { value: 'endowment', label: 'PCC - Dotación' },
    { value: 'pcc', label: 'PCC - Inspección (Inicio)' },
    { value: 'pcc_liquids', label: 'PCC - Inspección (Líquidos)' },
    { value: 'utensils', label: 'PCC - Utensilios (Polvos)' },
    { value: 'utensils_liquids', label: 'PCC - Utensilios (Líquidos)' },
    { value: 'quality_pcc_final_inspection', label: 'PCC - Inspección (Final)' },
    { value: 'quality_magnet_inspection', label: 'PCC - Inspección Imán' },
];


export default function ReportsPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [users, setUsers] = useState<UserData[]>([]);
    
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('all');
    const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});
    const [reportData, setReportData] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchUsers = async () => {
            const usersData = await getAll<UserData>('users');
            setUsers(usersData);
        };
        fetchUsers();
    }, []);

    const handleGenerateReport = async () => {
        if (!selectedModule) return;
        setIsGenerating(true);
        setReportData([]);
        try {
            let data = await getAll<any>(selectedModule);

            if (selectedUserId && selectedUserId !== 'all') {
                data = data.filter(item => {
                    const responsibleId = item.responsible?.id || item.senderId;
                    return responsibleId === selectedUserId || item.id === selectedUserId || item.verifier?.id === selectedUserId
                });
            }

            if (dateRange.from && dateRange.to) {
                 data = data.filter(item => {
                    if(!item.date && !item.createdAt) return false;
                    const itemDate = item.date ? new Date(item.date) : item.createdAt.toDate();
                    // Adjust for timezone offset
                    const from = new Date(dateRange.from!);
                    from.setMinutes(from.getMinutes() + from.getTimezoneOffset());
                    const to = new Date(dateRange.to!);
                    to.setHours(23, 59, 59, 999); // Include the whole end day
                    return itemDate >= from && itemDate <= to;
                 });
            }
            setReportData(data);
        } catch (error) {
            console.error("Error generating report:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExportExcel = () => {
        if (reportData.length === 0) return;
        
        const worksheetData = reportData.map(item => {
            const { id, signature, supervisorSignature, productionLeadSignature, verificationSignature, avatarUrl, fileBase64, data: formulationData, ...rest } = item;
            
            const flatItem: Record<string, any> = {};
            for (const key in rest) {
                if (typeof rest[key] === 'object' && rest[key] !== null && !Array.isArray(rest[key])) {
                     if(rest[key].name) {
                        flatItem[key] = rest[key].name;
                     } else {
                        flatItem[key] = JSON.stringify(rest[key]);
                     }
                } else if(Array.isArray(rest[key])) {
                    flatItem[key] = JSON.stringify(rest[key]);
                } else {
                    flatItem[key] = rest[key];
                }
            }
            return flatItem;
        });
        
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, selectedModule);
        XLSX.writeFile(workbook, `Reporte_${selectedModule}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <>
            <Collapsible
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                className="mb-6"
            >
                <PageHeader
                    title="Generador de Reportes"
                    description="Filtra y exporta los datos de cualquier módulo del sistema."
                >
                    <div className="flex items-center gap-2">
                        <Button onClick={handleExportExcel} disabled={reportData.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar a Excel
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" />
                                {filtersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </PageHeader>
            
                <CollapsibleContent className="p-4 bg-muted/50 rounded-xl border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Módulo</Label>
                            <Select value={selectedModule} onValueChange={setSelectedModule}>
                                <SelectTrigger><SelectValue placeholder="Selecciona un módulo" /></SelectTrigger>
                                <SelectContent>
                                    {reportableModules.map(mod => <SelectItem key={mod.value} value={mod.value}>{mod.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                                <Label>Usuario (Opcional)</Label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger><SelectValue placeholder="Todos los usuarios" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los usuarios</SelectItem>
                                    {users.map(user => <SelectItem key={user.id} value={user.id!}>{user.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                            <div className="space-y-2">
                                <Label>Rango de Fechas (Opcional)</Label>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal bg-background ${!dateRange.from && "text-muted-foreground"}`}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y", { locale: es })} -{" "}
                                            {format(dateRange.to, "LLL dd, y", { locale: es })}
                                        </>
                                        ) : (
                                        format(dateRange.from, "LLL dd, y", { locale: es })
                                        )
                                    ) : (
                                        <span>Selecciona un rango</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={es}
                                    />
                                </PopoverContent>
                                </Popover>
                        </div>
                        <Button onClick={handleGenerateReport} disabled={!selectedModule || isGenerating} className="w-full">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generar Reporte
                        </Button>
                    </div>
                </CollapsibleContent>
            </Collapsible>


            {isGenerating ? (
                 <div className="mt-6 flex items-center justify-center text-muted-foreground border rounded-lg p-12">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <p>Generando reporte...</p>
                </div>
            ) : reportData.length > 0 ? (
                <div className="mt-6">
                    <h2 className="text-xl font-bold mb-4">Resultados del Reporte</h2>
                    <ReportTable data={reportData} module={selectedModule} />
                </div>
            ) : (
                <div className="mt-6 text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                    <p>Selecciona los filtros y haz clic en "Generar Reporte" para ver los datos.</p>
                </div>
            )}
        </>
    );
}
