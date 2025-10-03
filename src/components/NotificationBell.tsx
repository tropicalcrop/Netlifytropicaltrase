
'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Mail, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch, Timestamp } from 'firebase/firestore';
import { useCurrentUser } from '@/context/UserContext';
import { type Notification, type Reply, sendNotification as sendNewNotification } from '@/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationWithId extends Notification {
    id: string;
}

function NotificationDetailDialog({ notification, isOpen, onOpenChange }: { notification: NotificationWithId | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
    const currentUser = useCurrentUser();
    const [replyMessage, setReplyMessage] = useState("");
    const [isReplying, setIsReplying] = useState(false);

    if (!notification || !currentUser) return null;

    const canReply = currentUser.id === notification.recipient || currentUser.role === notification.recipient || notification.recipient === 'all' || currentUser.id === notification.senderId || (notification.replies || []).some(r => r.senderId === currentUser.id);

    const handleReply = async () => {
        if (!replyMessage.trim()) return;

        setIsReplying(true);
        const newReply: Reply = {
            message: replyMessage,
            senderId: currentUser.id as string,
            senderName: currentUser.name,
            createdAt: Timestamp.now(),
        };

        try {
            const notifRef = doc(db, 'notifications', notification.id);
            await updateDoc(notifRef, {
                replies: arrayUnion(newReply),
                readBy: arrayUnion(currentUser.id) 
            });

            if (currentUser.id !== notification.senderId) {
                await sendNewNotification({
                    title: `Re: ${notification.title}`,
                    message: `Hay una nueva respuesta de ${currentUser.name}.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: notification.senderId,
                    link: `/chat?id=${notification.senderId}`
                });
            }

            setReplyMessage("");
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsReplying(false);
        }
    };

    const allMessages = [
        { 
            isOriginal: true, 
            message: notification.message, 
            senderName: notification.senderName, 
            senderId: notification.senderId,
            createdAt: notification.createdAt?.toDate(),
            link: notification.link
        },
        ...(notification.replies || []).map(r => ({ 
            isOriginal: false, 
            ...r, 
            createdAt: r.createdAt?.toDate() 
        }))
    ].sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg flex flex-col h-[70vh] p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{notification.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="space-y-6 p-4">
                        {allMessages.map((item, index) => (
                            <div key={index} className={`flex items-start gap-3 ${item.senderId === currentUser.id ? 'justify-end' : ''}`}>
                                 {item.senderId !== currentUser.id && <Avatar className="h-8 w-8"><AvatarFallback>{item.senderName?.charAt(0)}</AvatarFallback></Avatar>}
                                <div className={`rounded-lg p-3 max-w-sm ${item.senderId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p className="text-sm font-semibold">{item.senderName}</p>
                                    <p className="text-sm">{item.message}</p>
                                    {item.link && (
                                        <Button asChild variant={item.senderId === currentUser.id ? 'secondary' : 'outline'} size="sm" className="mt-2" onClick={() => onOpenChange(false)}>
                                            <Link href={item.link}>Revisar</Link>
                                        </Button>
                                    )}
                                    <p className={`text-xs mt-1 text-right ${item.senderId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{item.createdAt ? formatDistanceToNow(item.createdAt, { addSuffix: true, locale: es }) : 'enviando...'}</p>
                                </div>
                                {item.senderId === currentUser.id && <Avatar className="h-8 w-8"><AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback></Avatar>}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                {canReply && (
                     <DialogFooter className="p-4 border-t">
                        <div className="flex w-full items-center gap-2">
                           <Input
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Escribe una respuesta..."
                                disabled={isReplying}
                                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                className="bg-muted border-0 focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <Button onClick={handleReply} disabled={isReplying || !replyMessage.trim()} size="icon" className="rounded-full flex-shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

function NotificationItem({ notification, onSelect }: { notification: NotificationWithId, onSelect: () => void }) {
    const content = (
        <div className="p-4 hover:bg-muted/50 cursor-pointer" onClick={onSelect}>
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
                Por {notification.senderName} - {notification.createdAt ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es }) : 'justo ahora'}
            </p>
        </div>
    );
    
    return content;
}

export default function NotificationBell() {
    const currentUser = useCurrentUser();
    const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationWithId | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allNotifications: NotificationWithId[] = [];
            snapshot.forEach(doc => {
                allNotifications.push({ id: doc.id, ...doc.data() } as NotificationWithId);
            });

            const userNotifications = allNotifications.filter(n => {
                const deletedBy = n.deletedBy || [];
                
                const isRecipient = n.recipient === 'all' || n.recipient === currentUser.role || n.recipient === currentUser.id;
                const isDeleted = deletedBy.includes(currentUser.id as string);
                
                const isParticipant = n.senderId === currentUser.id || (n.replies || []).some(r => r.senderId === currentUser.id);

                return (isRecipient || isParticipant) && !isDeleted;
            });
            
            setNotifications(userNotifications);

            const newUnreadCount = userNotifications.filter(n => !(n.readBy || []).includes(currentUser.id as string)).length;
            setHasUnread(newUnreadCount > 0);
        });

        return () => unsubscribe();

    }, [currentUser]);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && hasUnread && currentUser) {
            const unreadNotifications = notifications.filter(n => !(n.readBy || []).includes(currentUser.id as string));
            if (unreadNotifications.length > 0) {
                const batch = writeBatch(db);
                unreadNotifications.forEach(async (n) => {
                    const notifRef = doc(db, 'notifications', n.id);
                    batch.update(notifRef, {
                        readBy: arrayUnion(currentUser.id)
                    });
                });
                batch.commit();
            }
        }
    };
    
    const handleClearNotifications = async () => {
        if (!currentUser || notifications.length === 0) return;

        const batch = writeBatch(db);
        notifications.forEach(n => {
            const notifRef = doc(db, 'notifications', n.id);
            batch.update(notifRef, {
                deletedBy: arrayUnion(currentUser.id) 
            });
        });
        await batch.commit();
    }

    const classifiedNotifications = useMemo(() => {
        if (!currentUser) return { new: [], today: [], older: [] };

        const isToday = (someDate: Date) => {
            const today = new Date();
            return someDate.getDate() === today.getDate() &&
                someDate.getMonth() === today.getMonth() &&
                someDate.getFullYear() === today.getFullYear();
        };

        const newNots = notifications.filter(n => !(n.readBy || []).includes(currentUser.id as string));
        const readNots = notifications.filter(n => (n.readBy || []).includes(currentUser.id as string));
        
        const todayNots = readNots.filter(n => n.createdAt && isToday(n.createdAt.toDate()));
        const olderNots = readNots.filter(n => n.createdAt && !isToday(n.createdAt.toDate()));

        return { new: newNots, today: todayNots, older: olderNots };

    }, [notifications, currentUser]);
    
    const handleSelectNotification = async (notification: NotificationWithId) => {
        if (!currentUser) return;
        
        const isMessage = notification.recipient !== 'System';
        
        if (isMessage) {
            const otherParticipantId = notification.senderId === currentUser.id ? notification.recipient : notification.senderId;
            router.push(`/chat?id=${otherParticipantId}`);
        } else {
            setSelectedNotification(notification);
        }

        if (!(notification.readBy || []).includes(currentUser.id as string)) {
             const notifRef = doc(db, 'notifications', notification.id);
            await updateDoc(notifRef, {
                readBy: arrayUnion(currentUser.id)
            });
        }
    }
    
    return (
        <>
            <Popover onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {hasUnread && (
                            <span className="absolute top-1 right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                    <div className="p-4 font-medium border-b">
                        Notificaciones
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <>
                                {classifiedNotifications.new.length > 0 && (
                                    <div>
                                        <div className="p-2 text-xs font-semibold text-muted-foreground bg-secondary">Nuevas</div>
                                        {classifiedNotifications.new.map(n => <NotificationItem key={n.id} notification={n} onSelect={() => handleSelectNotification(n)} />)}
                                    </div>
                                )}
                                {classifiedNotifications.today.length > 0 && (
                                    <div>
                                        <div className="p-2 text-xs font-semibold text-muted-foreground bg-secondary">Hoy</div>
                                        {classifiedNotifications.today.map(n => <NotificationItem key={n.id} notification={n} onSelect={() => handleSelectNotification(n)} />)}
                                    </div>
                                )}
                                {classifiedNotifications.older.length > 0 && (
                                    <div>
                                        <div className="p-2 text-xs font-semibold text-muted-foreground bg-secondary">Anteriores</div>
                                        {classifiedNotifications.older.map(n => <NotificationItem key={n.id} notification={n} onSelect={() => handleSelectNotification(n)} />)}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                <Mail className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                                No tienes notificaciones.
                            </div>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-2 border-t">
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleClearNotifications}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Limpiar todo
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>
            <NotificationDetailDialog 
                notification={selectedNotification}
                isOpen={!!selectedNotification}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedNotification(null);
                    }
                }}
            />
        </>
    )
}
