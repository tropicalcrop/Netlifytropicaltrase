
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendNotification } from '@/services/notificationService';
import { useCurrentUser } from '@/context/UserContext';
import { type UserData } from '@/app/users/page';
import { type ProductionData } from '@/app/production/page';
import { Send, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getAll } from '@/services/firestoreService';

const detectInternalLink = (message: string, productionLots: ProductionData[], recipientRole?: string): string => {
    const lowerMessage = message.toLowerCase();
    
    const moduleMap: Record<string, string> = {
        'luminometria': '/quality/luminometry',
        'sensorial': '/quality/sensory',
        'inspeccion de area': '/quality/area-inspection',
        'en proceso': '/quality/in-process',
        'producto terminado': '/production/finished-product',
        'dotacion': '/pcc/endowment',
        'pcc': '/pcc/inspection',
        'basculas': '/production/scales',
        'básculas': '/production/scales',
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
    
    const roleDashboard = (recipientRole || 'administrator').toLowerCase();
    return `/dashboard/${roleDashboard}`;
};

export function MessengerCard() {
    const { toast } = useToast();
    const currentUser = useCurrentUser();
    const [users, setUsers] = useState<UserData[]>([]);
    const [productionLots, setProductionLots] = useState<ProductionData[]>([]);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationRecipient, setNotificationRecipient] = useState('all');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [usersData, lotsData] = await Promise.all([
                    getAll<UserData>('users'),
                    getAll<ProductionData>('production')
                ]);
                setUsers(usersData);
                setProductionLots(lotsData.sort((a,b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()));
            } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los datos para el mensajero.' });
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, [toast]);
    
    const handleLotSelection = (lotId: string) => {
        const selectedLot = productionLots.find(lot => lot.id === lotId);
        if (selectedLot) {
            setNotificationMessage(`Atención equipo: El próximo lote a fabricar es el ${selectedLot.lot} - ${selectedLot.product}.`);
        }
    };

    const handleSendNotification = async () => {
        if (!notificationMessage.trim() || !currentUser) return;

        setIsSending(true);
        try {
            let recipientRole: string | undefined;
            const recipientIsUser = users.find(u => u.id === notificationRecipient);
            if (recipientIsUser) {
                recipientRole = recipientIsUser.role;
            } else if (['Administrator', 'Quality', 'Production'].includes(notificationRecipient)) {
                recipientRole = notificationRecipient;
            }

            await sendNotification({
                title: `Mensaje de ${currentUser.name}`,
                message: notificationMessage,
                senderId: currentUser.id as string,
                senderName: currentUser.name,
                recipient: notificationRecipient,
                link: detectInternalLink(notificationMessage, productionLots, recipientRole),
            });
            toast({ title: 'Mensaje Enviado', description: 'La notificación ha sido distribuida.' });
            setNotificationMessage('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la notificación.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-background text-foreground p-6 rounded-xl">
             <div className="flex flex-col space-y-1.5 text-left mb-6">
                <h2 className="text-2xl font-semibold leading-none tracking-tight">Enviar Mensaje</h2>
                <p className="text-sm text-muted-foreground">Envía un mensaje a un usuario, rol o a todos.</p>
             </div>
             
             {isLoadingData ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
             ) : (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="recipient">Enviar a:</Label>
                        <Select value={notificationRecipient} onValueChange={setNotificationRecipient}>
                            <SelectTrigger id="recipient" className="w-full">
                                <SelectValue placeholder="Seleccionar destinatario..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Usuarios</SelectItem>
                                <SelectItem value="Administrator">Rol: Administrador</SelectItem>
                                <SelectItem value="Quality">Rol: Calidad</SelectItem>
                                <SelectItem value="Production">Rol: Producción</SelectItem>
                                {users.map(user => (
                                    <SelectItem key={user.id} value={user.id as string}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="lot-selector">Sugerir Lote (Opcional):</Label>
                        <Select onValueChange={handleLotSelection}>
                            <SelectTrigger id="lot-selector" className="w-full">
                                <SelectValue placeholder="Seleccionar un lote para autocompletar..." />
                            </SelectTrigger>
                            <SelectContent>
                                {productionLots.map(lot => (
                                    <SelectItem key={lot.id} value={lot.id!}>{lot.lot} - {lot.product}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Textarea
                        placeholder="Escribe tu mensaje aquí..."
                        className="min-h-32 bg-muted/50 border-border"
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                    />
                    <Button onClick={handleSendNotification} disabled={isSending || !notificationMessage.trim()} className="w-full h-12 text-base bg-primary hover:bg-primary/90">
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        {isSending ? 'Enviando...' : 'Enviar Mensaje'}
                    </Button>
                </div>
            )}
        </div>
    );
}
