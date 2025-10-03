'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    CheckCircle, ClipboardCheck, FlaskConical, Thermometer, Wrench, Scale, Users, Magnet, CheckSquare, Weight, Lock, Loader2, Unlock, SprayCan, TestTube2, Printer, Archive, Beaker, ListOrdered
} from "lucide-react";
import Link from 'next/link';
import { getAll, addOrUpdate, remove, archiveQualityRecords } from '@/services/firestoreService';
import { type QualityData } from './types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCurrentUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { sendNotification } from '@/services/notificationService';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { type ProductionData } from '../production/page';

interface ControlModule {
    id: string;
    href: string;
    title: string;
    description: string;
    icon: React.ElementType;
    collectionNames: string[];
    type: 'powder' | 'liquid';
}

interface ModuleWithStatus extends ControlModule {
    status: 'locked' | 'unlocked' | 'completed_and_locked';
}

const controlModulesConfig: ControlModule[] = [
    // Powder-specific flow
    { id: 'hygiene_powders', href: "/quality/hygiene/powders", title: "Higiene y Saneamiento", description: "Registro y verificación de limpieza.", icon: Wrench, collectionNames: ["hygiene"], type: 'powder' },
    { id: 'luminometry_powders', href: "/quality/luminometry/powders", title: "Luminometría", description: "Medición para polvos.", icon: Thermometer, collectionNames: ["quality_luminometry"], type: 'powder' },
    { id: 'area_clearance_powders', href: "/quality/area-clearance/powders", title: "Despeje de Área", description: "Verificación para polvos.", icon: SprayCan, collectionNames: ["quality_area_clearance_powders"], type: 'powder' },
    { id: 'scales_powders', href: "/quality/scales/powders", title: "Verificación de Básculas", description: "Pruebas para básculas de polvos.", icon: Scale, collectionNames: ["scales"], type: 'powder' },
    { id: 'utensils_powders', href: "/pcc/utensils", title: "Inspección de Utensilios", description: "Registro de entrada y salida de utensilios.", icon: ClipboardCheck, collectionNames: ["utensils"], type: 'powder' },
    { id: 'pcc_powders', href: "/pcc/inspection", title: "Inspección PCC (Inicio)", description: "Verificación de mallas y filtros al inicio.", icon: FlaskConical, collectionNames: ["pcc"], type: 'powder' },
    { id: 'temp-humidity_powders', href: "/quality/temp-humidity", title: "Temperatura y Humedad", description: "Condiciones ambientales del área.", icon: Thermometer, collectionNames: ["quality_temp_humidity"], type: 'powder' },
    { id: 'in-process_powders', href: "/quality/in-process/powders", title: "Control en Proceso", description: "Muestreo durante producción de polvos.", icon: TestTube2, collectionNames: ["quality_in_process"], type: 'powder' },
    { id: 'finished-product_powders', href: "/quality/finished-product", title: "Envasado y Empaque", description: "Aprobación y registro de envasado.", icon: CheckSquare, collectionNames: ["quality_finished_product"], type: 'powder' },
    { id: 'final-bulk-inspection_powders', href: "/quality/final-bulk-inspection", title: "Inspección del Bulto Final", description: "Inspección final del bulto (saldo).", icon: ClipboardCheck, collectionNames: ["quality_final_bulk_inspection"], type: 'powder' },
    { id: 'pcc_final_inspection_powders', href: "/pcc/final-inspection", title: "Inspección PCC (Final)", description: "Verificación de PCC al final.", icon: ClipboardCheck, collectionNames: ["quality_pcc_final_inspection"], type: 'powder' },
    { id: 'magnet-inspection_powders', href: "/pcc/magnet-inspection", title: "Inspección de Imán (Final)", description: "Revisión de imán al final de fabricación.", icon: Magnet, collectionNames: ["quality_magnet_inspection"], type: 'powder' },
    { id: 'attribute-release_powders', href: "/quality/attribute-release", title: "Liberación por Atributos", description: "Verificación final de envasado y embalaje.", icon: CheckSquare, collectionNames: ["quality_attribute_release"], type: 'powder' },
    { id: 'weighing_powders', href: "/quality/weighing", title: "Pesaje", description: "Control de pesaje en proceso.", icon: Weight, collectionNames: ["weighing"], type: 'powder' },
    
    // Liquid-specific flow
    { id: 'hygiene_liquids', href: "/quality/hygiene/liquids", title: "Higiene y Saneamiento", description: "Registro y verificación de limpieza.", icon: Wrench, collectionNames: ["hygiene_liquids"], type: 'liquid' },
    { id: 'luminometry_liquids', href: "/quality/luminometry/liquids", title: "Luminometría", description: "Medición para líquidos.", icon: Thermometer, collectionNames: ["quality_luminometry_liquids"], type: 'liquid' },
    { id: 'area_clearance_liquids', href: "/quality/area-clearance/liquids", title: "Despeje de Área", description: "Verificación para líquidos.", icon: SprayCan, collectionNames: ["quality_area_clearance_liquids"], type: 'liquid' },
    { id: 'scales_liquids', href: "/quality/scales/liquids", title: "Verificación de Básculas", description: "Pruebas para básculas de líquidos.", icon: Scale, collectionNames: ["scales-liquids"], type: 'liquid' },
    { id: 'endowment_liquids', href: "/pcc/endowment", title: "Inspección de Operarios (EPP)", description: "Verificación de Equipo de Protección Personal.", icon: Users, collectionNames: ["endowment"], type: 'liquid' },
    { id: 'utensils_liquids', href: "/quality/utensils-liquids", title: "Inspección de Utensilios y Artículos", description: "Chequeo de utensilios para líquidos.", icon: ClipboardCheck, collectionNames: ["utensils_liquids"], type: 'liquid' },
    { id: 'pcc_liquids', href: "/quality/pcc-liquids", title: "Inspección PCC (Inicio)", description: "Inspección de filtro al inicio de fabricación.", icon: FlaskConical, collectionNames: ["pcc_liquids"], type: 'liquid' },
    { id: 'temp-humidity_liquids', href: "/quality/temp-humidity", title: "Temperatura y Humedad", description: "Condiciones ambientales del área.", icon: Thermometer, collectionNames: ["quality_temp_humidity"], type: 'liquid' },
    { id: 'in-process_liquids', href: "/quality/in-process/liquids", title: "Control en Proceso", description: "Muestreo durante producción de líquidos.", icon: TestTube2, collectionNames: ["quality_in_process_liquids"], type: 'liquid' },
    { id: 'finished-product_liquids', href: "/quality/finished-product", title: "Envasado y Empaque", description: "Aprobación y registro de envasado.", icon: CheckSquare, collectionNames: ["quality_finished_product"], type: 'liquid' },
    { id: 'pcc_final_inspection_liquids', href: "/quality/final-bulk-inspection", title: "Inspección PCC (Final)", description: "Verificación de PCC al final.", icon: ClipboardCheck, collectionNames: ["quality_pcc_final_inspection"], type: 'liquid' },
    { id: 'attribute-release_liquids', href: "/quality/attribute-release", title: "Liberación por Atributos", description: "Verificación final de envasado y embalaje.", icon: CheckSquare, collectionNames: ["quality_attribute_release"], type: 'liquid' },
    { id: 'weighing_liquids', href: "/quality/weighing", title: "Pesaje", description: "Control de pesaje en proceso.", icon: Weight, collectionNames: ["weighing"], type: 'liquid' },
];


const getApprovalStatusesForModule = (collectionName: string): string[] => {
    const map: Record<string, string[]> = {
        "hygiene": ["Verificado"],
        "hygiene_liquids": ["Verificado"],
        "quality_luminometry": ["Pasa"],
        "quality_luminometry_liquids": ["Pasa"],
        "quality_area_clearance_powders": ["Conforme"],
        "quality_area_clearance_liquids": ["Conforme"],
        "scales": ["Cumple"],
        "scales-liquids": ["Cumple"],
        "utensils_liquids": ["SI"],
        "pcc_liquids": ["SI"],
        "endowment": ["Conforme"],
        "utensils": ["Conforme"],
        "pcc": ["Conforme"],
        "quality_pcc_final_inspection": ["Conforme"],
        "quality_temp_humidity": ["Conforme"],
        "quality_in_process": ["Conforme"],
        "quality_in_process_liquids": ["Cumple"],
        "weighing": ["Conforme"],
        "quality_finished_product": ["Aprobado para Envasar"],
        "quality_final_bulk_inspection": ["SI"],
        "quality_magnet_inspection": ["Conforme"],
        "quality_attribute_release": ["Aprobado"],
    };
    return map[collectionName] || ['Completado', 'Verificado', 'Pasa', 'Conforme', 'Cumple', 'Aprobado', 'Aprobado para Envasar'];
};


const isModuleFullyApproved = (module: ControlModule, allRecords: (QualityData & { collectionName: string })[]): boolean => {
    const recordsForModule = allRecords.filter(r => module.collectionNames.includes(r.collectionName));
    if (recordsForModule.length === 0) {
        return false;
    }
    return recordsForModule.every(record => {
        const recordStatus = record.status || record.result || record.checklistCompleted || record.filterMeshState || record.foreignParticlesEvidence;
        const approvalStatuses = getApprovalStatusesForModule(record.collectionName);
        return recordStatus && approvalStatuses.includes(recordStatus);
    });
};


export default function QualityPage() {
    const currentUser = useCurrentUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const flowType = (searchParams.get('flow') || 'powder') as 'powder' | 'liquid';

    const [modules, setModules] = useState<ModuleWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCycleComplete, setIsCycleComplete] = useState(false);
    
    const getFlowModules = useCallback((type: 'powder' | 'liquid') => {
        return controlModulesConfig.filter(m => m.type === type);
    }, []);

    const fetchModuleStatuses = useCallback(async () => {
        setIsLoading(true);

        try {
            const qualityDocsPromises = getFlowModules(flowType).flatMap(m => m.collectionNames).map(name => getAll<QualityData>(name).then(docs => docs.map(d => ({...d, collectionName: name}))));
            
            const qualityDocsArrays = await Promise.all(qualityDocsPromises);
            const allRecords = qualityDocsArrays.flat();

            const overrides = await getAll<{id: string; status: 'unlocked'}>('module_overrides');
            const overrideMap = new Map(overrides.map(o => [o.id, o.status]));

            const activeRecords = allRecords.filter(r => (r.cycleId === null || r.cycleId === undefined));

            const moduleApprovalStatus = getFlowModules(flowType).map(module => ({
                ...module,
                isApproved: isModuleFullyApproved(module, activeRecords)
            }));
            
            let firstIncompleteIndex = moduleApprovalStatus.findIndex(m => !m.isApproved);
            
            const hasAnyActiveRecords = activeRecords.length > 0;
            let isComplete = false;

            if (firstIncompleteIndex === -1 && hasAnyActiveRecords) {
                isComplete = true;
            } else if (firstIncompleteIndex === -1 && !hasAnyActiveRecords) {
                firstIncompleteIndex = 0;
            }
            
            setIsCycleComplete(isComplete);

            const finalModules: ModuleWithStatus[] = moduleApprovalStatus.map((module, index) => {
                let status: 'locked' | 'unlocked' | 'completed_and_locked';

                if (overrideMap.has(module.id)) {
                    status = 'unlocked';
                } else if (firstIncompleteIndex === -1) {
                    status = 'completed_and_locked';
                } else if (index < firstIncompleteIndex) {
                    status = 'completed_and_locked';
                } else if (index === firstIncompleteIndex) {
                    status = 'unlocked';
                } else {
                    status = 'locked';
                }
                
                return { ...module, status };
            });

            setModules(finalModules);

        } catch (error) {
            console.error("Error fetching module statuses:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el estado de los módulos.' });
        } finally {
            setIsLoading(false);
        }

    }, [toast, flowType, getFlowModules]);


    const handleArchiveAndResetCycle = useCallback(async (type: 'powder' | 'liquid') => {
        if (!currentUser || currentUser.role !== 'Administrator') return;
        setIsLoading(true);

        const flowModules = getFlowModules(type);
        const newCycleId = `cycle-${type}-${Date.now()}`;
        const collectionNamesToArchive = flowModules.flatMap(m => m.collectionNames);

        try {
            await archiveQualityRecords(collectionNamesToArchive, newCycleId);
            
            await sendNotification({
                title: `Nuevo Ciclo de Calidad (${type}) Iniciado`,
                message: `El ciclo anterior ha sido completado y archivado.`,
                senderId: currentUser.id as string,
                senderName: 'Sistema',
                recipient: 'Administrator',
            });

            fetchModuleStatuses();
        } catch (error) {
            console.error(`Error archiving and resetting ${type} cycle:`, error);
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo archivar el ciclo de ${type}.` });
            setIsLoading(false);
        }

    }, [currentUser, toast, fetchModuleStatuses, getFlowModules]);


    useEffect(() => {
        if(currentUser){
            fetchModuleStatuses();
        }
    }, [currentUser, fetchModuleStatuses]);
    
     const handleToggleLock = async (module: ModuleWithStatus) => {
        if (currentUser?.role !== 'Administrator') return;

        try {
            const overrideDoc = await getAll<{id: string}>('module_overrides').then(overrides => overrides.find(o => o.id === module.id));

            if (overrideDoc) {
                await remove('module_overrides', module.id);
                await sendNotification({
                    title: 'Control Automático Restaurado',
                    message: `El módulo "${module.title}" vuelve a seguir la secuencia.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'all'
                });
            } else {
                await addOrUpdate('module_overrides', { id: module.id, status: 'unlocked' });
                await sendNotification({
                    title: 'Módulo Desbloqueado Manualmente',
                    message: `"${module.title}" ha sido desbloqueado para todos los roles.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'all'
                });
            }
            
            fetchModuleStatuses();
        } catch (error) {
            console.error("Error toggling module lock:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el estado del módulo.' });
        }
    };

    const pageTitle = `Producción de ${flowType === 'powder' ? 'Polvos' : 'Líquidos'}`;
    const pageDescription = `Siga el flujo de trabajo para la producción de ${flowType === 'powder' ? 'polvos' : 'líquidos'}.`;
    
    const renderModuleCard = (item: ModuleWithStatus) => {
        const isAdmin = currentUser?.role === 'Administrator';
        const isUnlocked = item.status === 'unlocked';
        const isCompleted = item.status === 'completed_and_locked';
        
        const isClickable = isUnlocked || isAdmin;
        const isVisuallyDisabled = !isClickable;

        const cardContent = (
             <Card className={cn(
                "h-full hover:shadow-md transition-all flex flex-col relative rounded-xl",
                isVisuallyDisabled && "bg-muted/50 opacity-70 cursor-not-allowed",
                isUnlocked && !isCompleted && "border-primary ring-2 ring-primary/50",
             )}>
                <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                    <div className="p-2 bg-muted rounded-full">
                        <item.icon className={cn("h-6 w-6 text-muted-foreground", isCompleted && "text-green-500")} />
                    </div>
                    <div className="flex-1 pr-8">
                        <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 pt-0">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>

                 <div className="absolute top-2 right-2 flex items-center gap-1">
                    {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleToggleLock(item); }}>
                           {item.status === 'unlocked' ? <Unlock className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    )}
                     {isCompleted && (
                       <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-default">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Módulo completado.</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {item.status === 'locked' && !isAdmin && <Lock className="h-6 w-6 text-muted-foreground" />}
                </div>
            </Card>
        );

        if (isClickable) {
            return <Link key={item.id} href={item.href} className="h-full">{cardContent}</Link>;
        }

        return (
             <TooltipProvider key={item.id}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="h-full w-full">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isCompleted ? "Módulo completado." : "Completa el módulo anterior para desbloquear."}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Controles de Calidad y Proceso"
                description={isLoading ? "Cargando estado de los módulos..." : pageDescription}
            >
                {currentUser?.role === 'Administrator' && (
                     <Button onClick={() => router.push('/quality/print-cycle')}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Formato
                    </Button>
                )}
            </PageHeader>
            
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">

                    {isCycleComplete && currentUser?.role === 'Administrator' && (
                         <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                <div>
                                    <h3 className="font-semibold">¡Ciclo de {flowType === 'powder' ? 'Polvos' : 'Líquidos'} Completado!</h3>
                                    <p className="text-sm text-muted-foreground">Todos los controles de calidad han sido aprobados.</p>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white w-full md:w-auto flex-shrink-0">Archivar y Reiniciar</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>¿Confirmar y archivar ciclo de {flowType === 'powder' ? 'Polvos' : 'Líquidos'}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción marcará todos los registros del ciclo como completados y reiniciará el flujo.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleArchiveAndResetCycle(flowType)}>Sí, Archivar y Reiniciar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {modules.map(renderModuleCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
