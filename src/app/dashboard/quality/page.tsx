
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, FileText, Hourglass, ArchiveX } from 'lucide-react';
import { getAll } from '@/services/firestoreService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStatusIcon } from '@/services/notificationService';
import { Separator } from '@/components/ui/separator';

export const revalidate = 0;

const getModuleLink = (module: string) => {
    const mapping: { [key: string]: string } = {
        'Higiene': '/quality/hygiene',
        'Luminometría': '/quality/luminometry',
        'Despeje Polvos': '/quality/area-clearance/powders',
        'Despeje Líquidos': '/quality/area-clearance/liquids',
        'PCC': '/pcc'
    };
    return mapping[module] || '/quality';
}

const getModuleIcon = (module: string) => {
    if (module.toLowerCase().includes('higiene')) return ShieldCheck;
    if (module.toLowerCase().includes('luminometría')) return ShieldCheck;
    if (module.toLowerCase().includes('despeje')) return ShieldCheck;
    if (module.toLowerCase().includes('pcc')) return ShieldCheck;
    return ShieldCheck;
};

export default async function QualityDashboard() {

    const qualityModules = [
        { name: 'quality_luminometry', label: 'Luminometría' },
        { name: 'hygiene', label: 'Higiene' },
        { name: 'quality_area_clearance_powders', label: 'Despeje Polvos' },
        { name: 'pcc', label: 'PCC' },
        { name: 'quality_finished_product', label: 'Producto Terminado' },
    ];

    const docsPromises = qualityModules.map(module => 
        getAll<any>(module.name).then(docs => 
        docs.map(d => ({ ...d, module: module.label, timestamp: d.date ? new Date(d.date) : new Date() }))
        )
    );

    const allDocsArrays = await Promise.all(docsPromises);
    const recentActivity = allDocsArrays.flat()
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

    const qualityFailures = allDocsArrays.flat().filter(n =>
        ['Falla', 'No Conforme', 'Rechazado'].includes(n.status || n.result)
    ).length;
    
    const pendingVerifications = allDocsArrays.flat().filter(n => n.module === 'Higiene' && n.status === 'Pendiente').length;
    
    const retainedLots = allDocsArrays.flat().filter(n => n.module === 'Producto Terminado' && n.status === 'Retenido').length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Calidad</h1>
        <p className="text-muted-foreground">Supervisa, verifica y asegura los estándares de calidad.</p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verificaciones Pendientes</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingVerifications}</div>
                        <p className="text-xs text-muted-foreground">Limpiezas esperando aprobación.</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertas de Calidad</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qualityFailures}</div>
                        <p className="text-xs text-muted-foreground">Pruebas con resultados fallidos.</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lotes Retenidos</CardTitle>
                        <ArchiveX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{retainedLots}</div>
                        <p className="text-xs text-muted-foreground">Lotes que no pueden ser envasados.</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                        <CardDescription>Últimas verificaciones y pruebas realizadas en el sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-2">
                                {recentActivity.map((activity, index) => {
                                    const Icon = getModuleIcon(activity.module);
                                    return (
                                    <React.Fragment key={activity.id}>
                                        <Link href={getModuleLink(activity.module)} className="block hover:bg-muted/50 p-2 rounded-md -m-2">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-muted rounded-full p-2">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{activity.area || activity.location || activity.pccId || 'Registro'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Resultado: {activity.status || activity.result} {getStatusIcon(activity.status || activity.result || '')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">{activity.module}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                        {index < recentActivity.length - 1 && <Separator />}
                                    </React.Fragment>
                                )})}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg">
                                <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                                <p>No hay actividad reciente.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
