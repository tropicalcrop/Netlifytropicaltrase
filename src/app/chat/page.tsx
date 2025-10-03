'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/context/UserContext';
import { type UserData } from '@/app/users/page';
import { type Notification, type Reply, sendNotification as sendNewNotification } from '@/services/notificationService';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, arrayUnion, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, isToday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, Users, User, Bot, ArrowLeft, Globe, MessageSquare, Paperclip, X, Camera, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/services/firestoreService';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NotificationWithId extends Notification {
    id: string;
}

interface Conversation {
    id: string;
    type: 'user' | 'role' | 'all';
    name: string;
    avatarUrl?: string;
    lastMessage: string;
    lastMessageTimestamp: Date;
    unreadCount: number;
    notifications: NotificationWithId[];
}

const roleAvatars: Record<string, React.ElementType> = {
    'Administrator': Bot,
    'Quality': User,
    'Production': Users,
    'all': Globe
};


export default function ChatPage() {
    const currentUser = useCurrentUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [users, setUsers] = useState<UserData[]>([]);
    const [notifications, setNotifications] = useState<NotificationWithId[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const initialChatId = searchParams.get('id');
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialChatId);

    const [replyMessage, setReplyMessage] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const conversations = useMemo(() => {
        if (!currentUser) return [];
    
        const convs: { [key: string]: Conversation } = {};
        
        const roleNameMapping: Record<string, string> = {
            Administrator: 'Administradores',
            Quality: 'Calidad',
            Production: 'Producción'
        };

        convs['all'] = { id: 'all', type: 'all', name: 'General', avatarUrl: '', notifications: [], lastMessage: '', lastMessageTimestamp: new Date(0), unreadCount: 0 };
    
        Object.keys(roleNameMapping).forEach(role => {
            convs[role] = { id: role, type: 'role', name: roleNameMapping[role], notifications: [], lastMessage: '', lastMessageTimestamp: new Date(0), unreadCount: 0 };
        });
    
        users.forEach(user => {
             if (user.id !== currentUser.id) {
                convs[user.id!] = { id: user.id!, type: 'user', name: user.name, avatarUrl: user.avatarUrl, notifications: [], lastMessage: '', lastMessageTimestamp: new Date(0), unreadCount: 0 };
            }
        });
    
        notifications.forEach(n => {
            let targetConvId: string | null = null;
    
            if (n.recipient === 'all') {
                targetConvId = 'all';
            } 
            else if (Object.keys(roleNameMapping).includes(n.recipient)) {
                targetConvId = n.recipient;
            } 
            else { 
                const otherUserId = n.senderId === currentUser.id ? n.recipient : n.senderId;
                if (convs[otherUserId]) {
                   targetConvId = otherUserId;
                }
            }

            if (targetConvId && convs[targetConvId]) {
                convs[targetConvId].notifications.push(n);
            }
        });
    
        Object.values(convs).forEach(c => {
            if (c.notifications.length > 0) {
                c.notifications.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
                const lastNotif = c.notifications[c.notifications.length - 1];
                const lastReply = (lastNotif?.replies || []).sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis()).pop();
                
                if (lastReply) {
                    c.lastMessage = lastReply.imageUrl ? '📷 Imagen' : lastReply.message;
                    c.lastMessageTimestamp = lastReply.createdAt.toDate();
                } else {
                    c.lastMessage = lastNotif.imageUrl ? '📷 Imagen' : lastNotif.message;
                    c.lastMessageTimestamp = lastNotif.createdAt ? lastNotif.createdAt.toDate() : new Date();
                }
    
                c.unreadCount = c.notifications.filter(n => !(n.readBy || []).includes(currentUser.id as string)).length;
            }
        });
    
        return Object.values(convs).filter(c => c.notifications.length > 0).sort((a, b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());
    
    }, [notifications, users, currentUser]);

    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [selectedConversationId, conversations]);

    const allMessages = useMemo(() => {
        if (!selectedConversation) return [];
        const messages: any[] = [];
        selectedConversation.notifications.forEach(n => {
            messages.push({
                id: n.id,
                message: n.message,
                imageUrl: n.imageUrl,
                senderId: n.senderId,
                senderName: n.senderName,
                createdAt: n.createdAt?.toDate(),
                link: n.link,
            });
            if (n.replies) {
                n.replies.forEach((r, i) => messages.push({
                    id: `${n.id}-reply-${i}`,
                    message: r.message,
                    imageUrl: r.imageUrl,
                    senderId: r.senderId,
                    senderName: r.senderName,
                    createdAt: r.createdAt.toDate(),
                }));
            }
        });
        return messages.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    }, [selectedConversation]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedConversationId, allMessages]);
    
    useEffect(() => {
        if (!currentUser) return;

        const usersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersData: UserData[] = [];
            snapshot.forEach(doc => usersData.push({ ...doc.data(), id: doc.id } as UserData));
            setUsers(usersData);
        });

        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
        const notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
            const allNotifications: NotificationWithId[] = [];
            snapshot.forEach(doc => {
                allNotifications.push({ id: doc.id, ...doc.data() } as NotificationWithId);
            });

             const userNotifications = allNotifications.filter(n => {
                const isRecipient = n.recipient === 'all' || n.recipient === currentUser.role || n.recipient === currentUser.id;
                const isParticipant = n.senderId === currentUser.id || (n.replies || []).some(r => r.senderId === currentUser.id);
                return isRecipient || isParticipant;
            });
            setNotifications(userNotifications);
        });

        return () => {
            usersUnsubscribe();
            notificationsUnsubscribe();
        };

    }, [currentUser]);

    useEffect(() => {
        let stream: MediaStream;
        const getCameraPermission = async () => {
          if (!isCameraOpen || !videoRef.current) return;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Acceso a la cámara denegado',
              description: 'Por favor, habilita los permisos de la cámara en tu navegador.',
            });
          }
        };
    
        getCameraPermission();
    
        return () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };
      }, [isCameraOpen, toast]);
    
    const filteredConversations = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        if (!searchTerm.trim()) {
            return conversations;
        }

        return conversations.filter(c => 
            c.name.toLowerCase().includes(lowerSearchTerm) ||
            c.lastMessage.toLowerCase().includes(lowerSearchTerm)
        );
    }, [searchTerm, conversations]);

    const handleSelectConversation = async (convId: string) => {
        setSelectedConversationId(convId);
        router.replace(`/chat?id=${convId}`, { scroll: false });
        
        const conv = conversations.find(c => c.id === convId);
        if (conv && conv.unreadCount > 0 && currentUser) {
            const unreadIds = conv.notifications.filter(n => !(n.readBy || []).includes(currentUser.id!)).map(n => n.id);
            const batch = writeBatch(db);
            unreadIds.forEach(id => {
                const notifRef = doc(db, 'notifications', id);
                batch.update(notifRef, { readBy: arrayUnion(currentUser.id) });
            });
            await batch.commit();
        }
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          context?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
              setImageFile(file);
              setImagePreview(URL.createObjectURL(file));
              setIsCameraOpen(false);
            }
          }, 'image/jpeg');
        }
    };

    const handleReply = async () => {
        if ((!replyMessage.trim() && !imageFile) || !currentUser || !selectedConversation) return;
    
        setIsReplying(true);
        try {
            let imageUrl: string | undefined = undefined;

            if (imageFile) {
                const filePath = `chat-photos/${Date.now()}_${imageFile.name}`;
                imageUrl = await uploadFile(imageFile, filePath);
            }

            const hasExistingMessages = selectedConversation.notifications.length > 0;
    
            if (hasExistingMessages) { 
                const lastNotif = selectedConversation.notifications.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))[0];
                const newReply: Reply = {
                    message: replyMessage,
                    imageUrl: imageUrl,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    createdAt: Timestamp.now(),
                };
    
                const notifRef = doc(db, 'notifications', lastNotif.id);
                await updateDoc(notifRef, {
                    replies: arrayUnion(newReply),
                    readBy: [currentUser.id]
                });
            } else { 
                await sendNewNotification({
                    title: `Mensaje de ${currentUser.name}`,
                    message: replyMessage,
                    imageUrl: imageUrl,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: selectedConversation.id,
                });
            }
            
            setReplyMessage("");
            setImageFile(null);
            setImagePreview(null);
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.'});
        } finally {
            setIsReplying(false);
        }
    };

    if (!currentUser) {
        return null;
    }
    
    const getAvatar = (conv: Conversation) => {
        if (conv.type === 'user' && conv.avatarUrl) {
            return <AvatarImage src={conv.avatarUrl} alt={conv.name} />
        }
        if (conv.type === 'role' || conv.type === 'all') {
            const Icon = roleAvatars[conv.id] || Users;
            return <AvatarFallback><Icon className="h-5 w-5"/></AvatarFallback>
        }
        return <AvatarFallback>{conv.name.charAt(0)}</AvatarFallback>
    };

    const leftPanel = (
         <div className={cn(
            "flex flex-col border-r bg-background w-full md:w-[450px] transition-all duration-300 h-full rounded-l-lg",
            selectedConversationId && "hidden md:flex"
        )}>
           <div className="p-4 border-b">
               <h2 className="text-xl font-bold">Chats</h2>
               <div className="relative mt-4">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input 
                       placeholder="Buscar mensajes o usuarios..." 
                       className="pl-10"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                   />
               </div>
           </div>
           <ScrollArea className="flex-1">
               <div className="p-2">
                   {filteredConversations.map(conv => (
                       <div
                           key={conv.id}
                           className={cn(
                               "p-3 rounded-lg cursor-pointer hover:bg-muted grid items-center gap-x-4",
                               "grid-cols-[auto_1fr_auto]",
                               selectedConversationId === conv.id && "bg-muted"
                           )}
                           onClick={() => handleSelectConversation(conv.id)}
                       >
                           <Avatar className="h-10 w-10">
                               {getAvatar(conv)}
                           </Avatar>
                           <div className="min-w-0">
                                <p className="font-semibold truncate">{conv.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || 'No hay mensajes aún.'}</p>
                            </div>
                            <div className="flex flex-col items-end text-xs text-muted-foreground space-y-1">
                                {conv.lastMessageTimestamp.getTime() > 0 && (
                                    <span className="whitespace-nowrap">
                                        {formatDistanceToNow(conv.lastMessageTimestamp, { locale: es, addSuffix: true })}
                                    </span>
                                )}
                                {conv.unreadCount > 0 && (
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                       </div>
                   ))}
               </div>
           </ScrollArea>
       </div>
   );
    
    const rightPanel = (
         <div className={cn(
            "flex-1 flex flex-col transition-all duration-300 h-full rounded-r-lg",
            !selectedConversationId ? "hidden md:flex" : "flex"
         )}>
             {selectedConversation ? (
                <>
                    <div className="p-4 border-b flex items-center gap-3">
                         <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversationId(null)}>
                            <ArrowLeft className="h-4 w-4"/>
                        </Button>
                        <Avatar className="h-10 w-10">
                            {getAvatar(selectedConversation)}
                        </Avatar>
                         <h3 className="text-lg font-semibold">{selectedConversation.name}</h3>
                    </div>
                     <ScrollArea className="flex-grow h-full bg-muted/30">
                        <div className="space-y-6 p-6">
                           {allMessages.map((item) => (
                                <div key={item.id} className={cn("flex w-full", item.senderId === currentUser.id ? 'justify-end' : 'justify-start')}>
                                    <div className={cn("flex items-end gap-3 max-w-[75%] break-words")}>
                                        {item.senderId !== currentUser.id && (
                                            <Avatar className="h-8 w-8 self-start">
                                                <AvatarFallback>{item.senderName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "rounded-lg p-3 relative space-y-2",
                                            item.senderId === currentUser.id ? 'bg-primary text-primary-foreground' : 'bg-background'
                                        )}>
                                            {item.imageUrl && (
                                                <Image src={item.imageUrl} alt="Imagen adjunta" width={300} height={200} className="rounded-md object-cover" />
                                            )}
                                            {item.message && <p className="text-sm">{item.message}</p>}
                                            <p className={cn("text-xs mt-1", item.senderId === currentUser.id ? 'text-primary-foreground/70' : 'text-muted-foreground', 'text-right')}>
                                                {item.createdAt ? format(item.createdAt, 'p', { locale: es }) : ''}
                                            </p>
                                        </div>
                                         {item.senderId === currentUser.id && (
                                            <Avatar className="h-8 w-8 self-start">
                                                <AvatarFallback>{item.senderName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background rounded-br-lg">
                         <div className="relative">
                            {imagePreview && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-muted rounded-lg">
                                    <Image src={imagePreview} alt="Vista previa" width={64} height={64} className="rounded-md object-cover"/>
                                    <Button size="icon" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground" onClick={() => {setImagePreview(null); setImageFile(null);}}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isReplying}>
                                    <Paperclip className="h-5 w-5"/>
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                <Button variant="ghost" size="icon" onClick={() => setIsCameraOpen(true)} disabled={isReplying}>
                                    <Camera className="h-5 w-5"/>
                                </Button>
                                <Input 
                                    placeholder="Escribe un mensaje..." 
                                    className="flex-1 h-12" 
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleReply())}
                                    disabled={isReplying}
                                />
                                <Button 
                                    size="icon" 
                                    className="rounded-full h-9 w-9"
                                    onClick={handleReply}
                                    disabled={isReplying || (!replyMessage.trim() && !imageFile)}
                                >
                                    <Send className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 items-center justify-center text-muted-foreground hidden md:flex">
                    <div className="text-center">
                        <MessageSquare className="mx-auto h-12 w-12" />
                        <p className="mt-2">Selecciona una conversación para empezar a chatear.</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-background rounded-lg flex flex-1 h-[calc(100vh-160px)]">
           {leftPanel}
           {rightPanel}
            <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tomar Foto</DialogTitle></DialogHeader>
                    <div className="relative">
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Acceso a la cámara denegado</AlertTitle>
                                <AlertDescription>Por favor, habilita los permisos de cámara en tu navegador.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCapture} disabled={!hasCameraPermission}>Capturar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    



