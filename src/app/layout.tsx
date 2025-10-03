
'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getAll } from '@/services/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { type UserData } from './users/page';
import { LogOut } from 'lucide-react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProvider } from '@/context/UserContext';
import NotificationBell from '@/components/NotificationBell';
import FloatingChatButton from '@/components/FloatingChatButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import { type ProductionData } from './production/page';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { AppSidebar } from '@/components/AppSidebar';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const auth = getAuth(app);

    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [productionData, setProductionData] = useState<ProductionData[]>([]);

    const isPrintPage = pathname === '/quality/print-cycle';
    const isLoginPage = pathname === '/login';
    const isChatPage = pathname === '/chat';

    const getDashboardPath = useCallback((role?: string) => {
        if (!role) return '/login';
        const rolePath = role.toLowerCase();
        return `/dashboard/${rolePath}`;
    }, []);

    const handleLogout = useCallback(async (isIdle = false) => {
        try {
            await signOut(auth);
            router.push('/login');
            if (isIdle) {
                toast({ title: 'Sesión cerrada por inactividad', description: 'Por tu seguridad, hemos cerrado la sesión.' });
            } else {
                toast({ title: 'Cierre de sesión exitoso' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.' });
        }
    }, [auth, router, toast]);

    useEffect(() => {
        if (currentUserData) {
            const fetchProductionData = async () => {
                const logs = await getAll<ProductionData>('production');
                setProductionData(logs);
            };
            fetchProductionData();
        }
    }, [currentUserData]);

    const productionQueue = React.useMemo(() => {
        const powderLot = productionData
            .filter(lot => lot.type === 'powder' && lot.status !== 'Completado' && lot.productionOrder != null)
            .sort((a, b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity))[0];

        const liquidLot = productionData
            .filter(lot => lot.type === 'liquid' && lot.status !== 'Completado' && lot.productionOrder != null)
            .sort((a, b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity))[0];

        return [powderLot, liquidLot].filter(Boolean) as ProductionData[];
    }, [productionData]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = { ...userDoc.data(), id: user.uid } as UserData;
                        setCurrentUserData(userData);
                        if (isLoginPage) {
                            router.replace(getDashboardPath(userData.role));
                        }
                    } else {
                        await signOut(auth);
                        setCurrentUserData(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    await signOut(auth);
                    setCurrentUserData(null);
                }
            } else {
                setCurrentUserData(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth, isLoginPage, router, getDashboardPath]);

    useEffect(() => {
        if (!isLoading && !currentUserData && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, currentUserData, pathname, router]);

    useEffect(() => {
        if (!currentUserData) return;

        let inactivityTimer: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                handleLogout(true);
            }, INACTIVITY_TIMEOUT);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('touchstart', resetTimer);

        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
        };
    }, [currentUserData, handleLogout]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!currentUserData || isLoginPage) {
        return <>{children}</>;
    }

    if (isPrintPage) {
        return <>{children}</>;
    }

    return (
        <UserProvider value={currentUserData}>
            <SidebarProvider>
                <Suspense fallback={<LoadingScreen />}>
                    <AppSidebar />
                </Suspense>
                <SidebarInset>
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="md:hidden" />
                            <div className="hidden md:block">
                                <h1 className="text-xl font-semibold">Bienvenido, {currentUserData.name}</h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <ThemeToggle />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage data-ai-hint="person avatar" src={currentUserData.avatarUrl} alt={currentUserData.name} />
                                            <AvatarFallback>{currentUserData.name.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{currentUserData.name}</p>
                                            <p className="text-xs leading-none text-muted-foreground">{currentUserData.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleLogout(false)}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-6 relative">
                        {productionQueue.length > 0 && !isPrintPage && !isLoginPage && !isChatPage && (
                            <Alert className="mb-6">
                                <ListOrdered className="h-4 w-4" />
                                <AlertTitle>Próximos Lotes en la Cola de Producción</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc pl-5 mt-2">
                                        {productionQueue.map((lot) => (
                                            <li key={lot.id}>
                                                <Link href={`/quality?flow=${lot.type}`} className="font-medium text-primary hover:underline">
                                                    <span className="font-semibold capitalize">{lot.type === 'powder' ? 'Polvo' : 'Líquido'}:</span> #{lot.productionOrder}: {lot.lot} - {lot.product}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                        <div>{children}</div>
                    </main>
                    {!isChatPage && <FloatingChatButton />}
                </SidebarInset>
            </SidebarProvider>
        </UserProvider>
    );
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <head>
                <title>Tropical Trace</title>
                <meta name="description" content="Ingenieria para Crear Alimentos" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AppLayoutContent>{children}</AppLayoutContent>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
