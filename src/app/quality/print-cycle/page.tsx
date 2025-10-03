
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { getAll } from '@/services/firestoreService';
import { type QualityData } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QualityFormPage from '../form-client';
import HygieneFormPage from '@/app/hygiene/form-page';
import PowderProductionFormPage from '@/app/production/powders/form-client';
import LiquidProductionFormClientPage from '@/app/production/liquids/form-client';
import { type ProductionData } from '@/app/production/page';

const controlModulesConfig = [
    { id: 'hygiene', title: "Higiene y Saneamiento", collectionNames: ["hygiene", "hygiene_liquids"], component: HygieneFormPage },
    { id: 'luminometry', title: "Luminometría", collectionNames: ["quality_luminometry", "quality_luminometry_liquids"], component: QualityFormPage, formType: 'luminometry'},
    { id: 'area-clearance', title: "Despeje de Área", collectionNames: ["quality_area_clearance_powders", "quality_area_clearance_liquids"], component: QualityFormPage, formType: 'area-clearance-powders' },
    { id: 'scales', title: "Verificación de Básculas", collectionNames: ["scales", "scales-liquids"], component: QualityFormPage, formType: 'scales' },
    { id: 'endowment', title: "Inspección de Operarios (EPP)", collectionNames: ["endowment"], component: QualityFormPage, formType: 'endowment' },
    { id: 'utensils', title: "Inspección de Utensilios", collectionNames: ["utensils"], component: QualityFormPage, formType: 'utensils' },
    { id: 'pcc', title: "Inspección PCC (Inicio)", collectionNames: ["pcc"], component: QualityFormPage, formType: 'pcc' },
    { id: 'temp-humidity', title: "Temperatura y Humedad", collectionNames: ["quality_temp_humidity"], component: QualityFormPage, formType: 'temp-humidity' },
    { id: 'production_liquids', title: "Producción Líquidos", collectionNames: ["production"], component: LiquidProductionFormClientPage, filter: (rec: any) => rec.type === 'liquid' },
    { id: 'production_powders', title: "Producción Polvos", collectionNames: ["production"], component: PowderProductionFormPage, filter: (rec: any) => rec.type === 'powder' },
    { id: 'in-process', title: "Control en Proceso", collectionNames: ["quality_in_process", "quality_in_process_liquids"], component: QualityFormPage, formType: 'in-process' },
    { id: 'weighing', title: "Pesaje", collectionNames: ["weighing"], component: QualityFormPage, formType: 'weighing' },
    { id: 'finished_product', title: "Envasado y Empaque", collectionNames: ["quality_finished_product"], component: QualityFormPage, formType: 'finished-product' },
    { id: 'magnet_inspection', title: "Inspección de Imán (Final)", collectionNames: ["quality_magnet_inspection"], component: QualityFormPage, formType: 'magnet-inspection' },
    { id: 'attribute_release', title: "Liberación por Atributos", collectionNames: ["quality_attribute_release"], component: QualityFormPage, formType: 'attribute-release' },
];


export default function PrintCyclePage() {
    const [cycleData, setCycleData] = useState<Record<string, (QualityData | ProductionData)[]>>({});
    const [isLoading, setIsLoading] = useState(true);

    const orderedModules = useMemo(() => {
        const moduleMap = new Map(controlModulesConfig.map(m => [m.id, m]));
        const order = [
            'hygiene', 'luminometry', 'area-clearance', 'scales', 'endowment',
            'utensils', 'pcc', 'temp-humidity', 'production_liquids', 'production_powders',
            'in-process', 'weighing', 'finished_product', 'magnet_inspection', 'attribute_release'
        ];
        return order.map(id => moduleMap.get(id)).filter(Boolean) as typeof controlModulesConfig;
    }, []);

    useEffect(() => {
        const fetchCycleData = async () => {
            setIsLoading(true);
            const data: Record<string, (QualityData | ProductionData)[]> = {};

            for (const module of orderedModules) {
                const moduleRecords: (QualityData | ProductionData)[] = [];
                for (const collectionName of module.collectionNames) {
                    const records = await getAll<QualityData | ProductionData>(collectionName);
                    let activeRecords = records.filter(r => (r as any).cycleId === null || (r as any).cycleId === undefined);
                    
                    if (module.filter) {
                        activeRecords = activeRecords.filter(module.filter);
                    }
                    moduleRecords.push(...activeRecords);
                }
                data[module.id] = moduleRecords;
            }

            setCycleData(data);
            setIsLoading(false);
        };

        fetchCycleData();
    }, [orderedModules]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Cargando datos del ciclo...</p>
            </div>
        );
    }
    
    return (
        <div className="bg-background text-foreground p-4 sm:p-8 print:p-0">
            <style jsx global>{`
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                     main {
                        padding: 0 !important;
                    }
                    .printable-form {
                        border: none;
                        box-shadow: none;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            
            <div className="no-print">
                 <PageHeader title="Imprimir Ciclo de Calidad" description="Vista previa del reporte completo del ciclo de calidad actual.">
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </PageHeader>
            </div>

            <div className="space-y-6">
                <div className="text-center space-y-2 print:block hidden">
                     <h1 className="text-3xl font-bold">Reporte de Ciclo de Calidad</h1>
                     <p className="text-muted-foreground">Generado el: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {orderedModules.map(module => {
                    const records = cycleData[module.id];
                    if (!records || records.length === 0) return null;
                    
                    const FormComponent = module.component;

                    return (
                        <div key={module.id} className="break-inside-avoid">
                             {records.map((record: any) => {
                                const collectionNameForRecord = module.collectionNames.find(cn => record.id.startsWith(cn)) || module.collectionNames[0];
                                return (
                                <div key={record.id} className="mb-8 printable-form">
                                     <FormComponent 
                                         logId={record.id} 
                                         formType={module.formType as any} 
                                         isPrintView={true} 
                                         collectionName={collectionNameForRecord}
                                     />
                                </div>
                             )})}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
