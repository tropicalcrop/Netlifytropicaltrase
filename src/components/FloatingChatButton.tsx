'use client'

import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useCurrentUser } from '@/context/UserContext';
import { type Notification } from '@/services/notificationService';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationWithId extends Notification {
    id: string;
}

export default function FloatingChatButton() {
    const currentUser = useCurrentUser();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let count = 0;
            snapshot.forEach(doc => {
                const notification = doc.data() as Notification;
                const isRecipient = notification.recipient === 'all' || notification.recipient === currentUser.role || notification.recipient === currentUser.id;
                const isParticipant = notification.senderId === currentUser.id || (notification.replies || []).some(r => r.senderId === currentUser.id);
                const isRead = (notification.readBy || []).includes(currentUser.id as string);
                const isDeleted = (notification.deletedBy || []).includes(currentUser.id as string);

                if ((isRecipient || isParticipant) && !isRead && !isDeleted) {
                    count++;
                }
            });
            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [currentUser]);

    if (!currentUser) return null;

    return (
        <Link href="/chat" passHref>
            <Button
                variant="default"
                size="icon"
                title="Chat"
                className={cn(
                    "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50",
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                    "transition-transform duration-300 ease-in-out transform hover:scale-110"
                )}
                aria-label="Abrir chat"
            >
                <MessageSquare className="h-8 w-8" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground border-2 border-background">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </Link>
    );
}
