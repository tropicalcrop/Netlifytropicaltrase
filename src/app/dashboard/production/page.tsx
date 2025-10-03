
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Factory, TrendingUp, CheckCircle, ChevronRight } from 'lucide-react';
import { getAll } from '@/services/firestoreService';
import { type ProductionData } from '@/app/production/page';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export const revalidate = 0;

export default async function ProductionDashboard() {
  const allLots = await getAll<ProductionData>('production');
  
  const productionQueue = allLots
    .filter(lot => lot.status !== 'Completado' && lot.productionOrder != null)
    .sort((a, b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity));

  const today = new Date();
  const completedTodayCount = allLots.filter(lot => 
    lot.status === 'Completado' && lot.date && isToday(new Date(lot.date))
  ).length;

  const totalPerformance = allLots.reduce((acc, lot) => acc + (lot.performance || 0), 0);
  const averagePerformance = allLots.length > 0 ? (totalPerformance / allLots.length).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
       <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Producción</h1>
        <p className="text-muted-foreground">Resumen de la actividad y métricas clave de producción.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 space-y-6">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lotes Completados Hoy</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{completedTodayCount}</div>
                      <p className="text-xs text-muted-foreground">Lotes finalizados en la jornada actual.</p>
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rendimiento Promedio</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{averagePerformance}%</div>
                      <p className="text-xs text-muted-foreground">Media histórica de todos los lotes.</p>
                    </CardContent>
                </Card>
             </div>
          
           <div>
                <div className="mb-4">
                    <h2 className="text-xl font-semibold">Próximos Lotes en la Cola</h2>
                    <p className="text-sm text-muted-foreground">Lotes listos para ser fabricados, ordenados por prioridad.</p>
                </div>
                {productionQueue.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productionQueue.map(lot => (
                            <Link href={`/production/${lot.item}`} key={lot.id}>
                                <Card className="hover:shadow-md transition-shadow rounded-xl h-full">
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-base mb-1">{lot.product}</h3>
                                                <Badge variant="secondary">{lot.status}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Lote: {lot.lot}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Fecha: {lot.date ? format(new Date(lot.date), 'P', { locale: es }) : 'N/A'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground border-dashed border-2 rounded-lg p-12">
                         <Factory className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                         <p>No hay lotes en la cola de producción.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
