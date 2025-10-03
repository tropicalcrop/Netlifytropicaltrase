
'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import { type UserData } from '@/app/users/page';
import { type ProductionData } from '@/app/production/page';
import { Users, AlertTriangle, Send, Bell, UserCheck, TestTube2, ShieldCheck, FileText, Factory, CheckCircle, Clock, Wrench, Lock, Unlock, RotateCw } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface RecentActivity {
    id: string;
    description: string;
    module: string;
    timestamp: Date;
    icon: React.ElementType;
    link: string;
}

const getModuleIcon = (module: string) => {
    if (module.toLowerCase().includes('calidad')) return ShieldCheck;
    if (module.toLowerCase().includes('dotación')) return UserCheck;
    if (module.toLowerCase().includes('pcc')) return TestTube2;
    if (module.toLowerCase().includes('producción')) return Factory;
    if (module.toLowerCase().includes('higiene')) return Wrench;
    if (module.toLowerCase().includes('usuarios')) return Users;
    return FileText;
};

const getStatusIcon = (status: string) => {
    const negativeStatus = ['Falla', 'No Conforme', 'Retenido', 'No Cumple', 'Rechazado'];
    const positiveStatus = ['Pasa', 'Aprobado', 'Conforme', 'Cumple', 'Verificado', 'Aprobado para Envasar', 'Completado'];

    if(negativeStatus.includes(status)) return '🔴';
    if(positiveStatus.includes(status)) return '✅';
    return '🔄️';
}


interface AdminDashboardProps {
  initialUsers: UserData[];
  initialProductionLots: ProductionData[];
  initialNotifications: { createdAt: string, [key: string]: any }[];
  totalQualityDocs: number;
  qualityFailures: number;
}

const detectInternalLink = (message: string, productionLots: ProductionData[], recipientRole?: string): string => {
    const lowerMessage = message.toLowerCase();
    
    const moduleMap: Record<string, string> = {
        'luminometria': '/quality/luminometry',
        'sensorial': '/quality/sensory',
        'inspeccion de area': '/quality/area-inspection',
        'en proceso': '/quality/in-process',
        'producto terminado': '/quality/finished-product',
        'dotacion': '/pcc/endowment',
        'pcc': '/pcc/inspection',
        'basculas': '/quality/scales',
        'básculas': '/quality/scales',
        'utensilios': '/pcc/utensils',
        'higiene': '/hygiene',
        'usuarios': '/users',
        'produccion': '/production',
        'producción': '/production',
        'calidad': '/quality',
        'reportes': '/reports',
        'formulaciones': '/formulations',
    };

    for (const key in moduleMap) {
        if (lowerMessage.includes(key)) {
            return moduleMap[key];
        }
    }

    const lotMatch = productionLots.find(lot => 
        (lot.lot && lowerMessage.includes(lot.lot.toLowerCase())) || 
        (lot.item && lowerMessage.includes(lot.item.toLowerCase()))
    );
    if (lotMatch && lotMatch.item) return `/production/${lotMatch.item}`;
    
    // Fallback to role-specific dashboard
    const roleDashboard = (recipientRole || 'administrator').toLowerCase();
    return `/dashboard/${roleDashboard}`;
};

function RecentActivityList({ activities }: { activities: RecentActivity[] }) {
    if (activities.length === 0) {
        return <p className="text-sm text-muted-foreground p-4">No hay actividad reciente.</p>;
    }
    return (
        <div className="space-y-1">
            {activities.map((activity, index) => {
                const Icon = activity.icon;
                const isValidDate = activity.timestamp && !isNaN(activity.timestamp.getTime());
                return (
                    <React.Fragment key={activity.id}>
                        <Link href={activity.link} className="block hover:bg-muted/50 p-3 rounded-lg -mx-3">
                            <div className="flex items-start gap-4">
                                <div className="bg-muted rounded-full p-2">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm leading-tight">{activity.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="text-xs text-muted-foreground">{activity.module}</div>
                                        <Separator orientation="vertical" className="h-3" />
                                        <div className="text-xs text-muted-foreground">
                                           {isValidDate ? formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es }) : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                        {index < activities.length - 1 && <Separator />}
                    </React.Fragment>
                )
            })}
        </div>
    );
}

export default function AdministratorDashboardClientPage({
  initialUsers,
  initialProductionLots,
  initialNotifications,
  totalQualityDocs,
  qualityFailures,
}: AdminDashboardProps) {

  const recentActivity = useMemo(() => {
    const activities: RecentActivity[] = initialNotifications.map((n: any) => {
        const timestamp = new Date(n.createdAt);
        const responsibleName = n.responsible?.name || n.name || 'Sistema';
        let statusText = n.observations || n.status || n.result || n.area || n.location || n.pccId || n.scale || n.role || 'realizó una acción';
        if (n.module === 'Higiene' && n.area) {
            statusText = `registró limpieza en el área "${n.area}"`;
        } else if (n.module === 'Calidad' && n.product) {
            statusText = `evaluó ${n.product} (Lote: ${n.lot}) como ${n.status || n.result}`;
        }

        const description = `${responsibleName} ${statusText}`;

        return {
            id: n.id,
            description: `${description} ${getStatusIcon(n.status || n.result || '')}`,
            module: n.module,
            timestamp: timestamp,
            icon: getModuleIcon(n.module),
            link: detectInternalLink(description, initialProductionLots, n.recipient)
        }
    });

    return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
  }, [initialNotifications, initialProductionLots]);

  const activityByModuleData = useMemo(() => {
    const productionCount = initialProductionLots.length;
    const hygieneCount = initialNotifications.filter(n => n.module === 'Higiene').length;
    const qualityCount = totalQualityDocs;

    return [
      { name: 'Producción', total: productionCount },
      { name: 'Calidad', total: qualityCount },
      { name: 'Higiene', total: hygieneCount },
    ];
  }, [initialProductionLots, totalQualityDocs, initialNotifications]);
  
  const chartConfig = {
    total: { label: "Total", color: "hsl(var(--chart-1))" },
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
       <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panel de Administrador</h1>
        <p className="text-muted-foreground">Visión global del sistema y las actividades de los usuarios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
                <Link href="/users">
                  <Card className="hover:shadow-md transition-shadow rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{initialUsers.length}</div>
                      <p className="text-xs text-muted-foreground">Total de usuarios registrados</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/quality">
                  <Card className="hover:shadow-md transition-shadow rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Alertas del Sistema</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{qualityFailures}</div>
                      <p className="text-xs text-muted-foreground">Pruebas de calidad fallidas</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/production">
                  <Card className="hover:shadow-md transition-shadow rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Lotes de Producción</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{initialProductionLots.length}</div>
                      <p className="text-xs text-muted-foreground">Histórico de lotes</p>
                    </CardContent>
                  </Card>
                </Link>
            </div>
             <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Un registro de los eventos más recientes del sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                 <RecentActivityList activities={recentActivity} />
              </CardContent>
            </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
             <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Actividad por Módulo</CardTitle>
                <CardDescription>Volumen de registros en los módulos principales.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px] w-full">
                  <BarChart data={activityByModuleData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{fontSize: 12}}/>
                      <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
