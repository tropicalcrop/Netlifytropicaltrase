
'use client'

import React, { useState, useEffect, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
// Importaciones de Firebase para la gestión de autenticación.
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAll } from "@/services/firestoreService";
// Importaciones de UI y componentes personalizados.
import { useToast } from "@/hooks/use-toast"
import { type UserData } from "./users/page"
import Link from "next/link"
import {
    Factory, FileText, FlaskConical, LayoutDashboard, LogOut, Settings, User, Users, Medal, ShieldCheck, History, FileCog, ClipboardCheck, Archive, Beaker, MessageSquare, ListOrdered
} from "lucide-react"
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset, SidebarTrigger, SidebarSeparator } from "@/components/ui/sidebar"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/logo"
import { UserProvider } from "@/context/UserContext"
import NotificationBell from "@/components/NotificationBell"
import FloatingChatButton from "@/components/FloatingChatButton";
import { ThemeToggle } from "@/components/ThemeToggle"
import { Separator } from "@/components/ui/separator"
import { LoadingScreen } from "@/components/LoadingScreen";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import { type ProductionData } from "./production/page";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


// Define el tipo para los roles de usuario.
type Role = "Administrator" | "Quality" | "Production";

// Configuración de todos los elementos del menú lateral.
const allMenuItems: {
    href?: string;
    label: string;
    icon?: React.ElementType;
    roles: Role[];
    isSection?: boolean;
}[] = [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard, roles: ["Administrator", "Quality", "Production"] },
    { href: "/chat", label: "Chat", icon: MessageSquare, roles: ["Administrator", "Quality", "Production"] },
    { href: "/production", label: "Producción", icon: Factory, roles: ["Production", "Administrator", "Quality"] },
    { href: "/quality?flow=powder", label: "Producción de Polvos", icon: Archive, roles: ["Quality", "Administrator", "Production"] },
    { href: "/quality?flow=liquid", label: "Producción de Líquidos", icon: Beaker, roles: ["Quality", "Administrator", "Production"] },
    { isSection: true, label: "Administración", roles: ["Administrator"] },
    { href: "/users", label: "Usuarios", icon: Users, roles: ["Administrator"] },
]

// Define el tiempo de inactividad antes de cerrar sesión automáticamente (15 minutos).
const INACTIVITY_TIMEOUT = 15 * 60 * 1000;

/**
 * Componente principal que envuelve toda la aplicación y gestiona el estado de autenticación y el layout.
 */
function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { toast } = useToast()
    const auth = getAuth(app);

    // Estado para almacenar los datos del usuario actual y controlar la carga.
    const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [productionData, setProductionData] = useState<ProductionData[]>([]);

    // Determina si la página actual es la vista de impresión para ocultar el layout.
    const isPrintPage = pathname === '/quality/print-cycle';
    const isLoginPage = pathname === '/login';
    const isChatPage = pathname === '/chat';

    const getDashboardPath = useCallback((role?: Role) => {
        if (!role) return '/login';
        const rolePath = role.toLowerCase();
        return `/dashboard/${rolePath}`;
    }, []);

    // Función para manejar el cierre de sesión, opcionalmente mostrando un mensaje de inactividad.
    const handleLogout = useCallback(async (isIdle = false) => {
        try {
            await signOut(auth)
            router.push('/login');
            if (isIdle) {
                toast({ title: 'Sesión cerrada por inactividad', description: 'Por tu seguridad, hemos cerrado la sesión.' })
            } else {
                toast({ title: 'Cierre de sesión exitoso' })
            }
        } catch (error) {
            console.error(error)
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cerrar la sesión.'})
        }
    }, [auth, router, toast]);

    useEffect(() => {
        if(currentUserData){
            const fetchProductionData = async () => {
                const logs = await getAll<ProductionData>('production');
                setProductionData(logs);
            };
            fetchProductionData();
        }
    },[currentUserData]);

    const productionQueue = React.useMemo(() => {
        const powderLot = productionData
            .filter(lot => lot.type === 'powder' && lot.status !== 'Completado' && lot.productionOrder != null)
            .sort((a, b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity))[0];
        
        const liquidLot = productionData
            .filter(lot => lot.type === 'liquid' && lot.status !== 'Completado' && lot.productionOrder != null)
            .sort((a, b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity))[0];
        
        return [powderLot, liquidLot].filter(Boolean) as ProductionData[];
    }, [productionData]);

    // Hook de efecto para escuchar los cambios en el estado de autenticación de Firebase.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Si hay un usuario, busca sus datos en Firestore.
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const userData = { ...userDoc.data(), id: user.uid } as UserData;
                        setCurrentUserData(userData);
                         if (isLoginPage) {
                            router.replace(getDashboardPath(userData.role));
                        }
                    } else {
                        // Si el usuario existe en Auth pero no en Firestore, es un estado inconsistente. Cierra sesión.
                        await signOut(auth);
                        setCurrentUserData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    await signOut(auth);
                    setCurrentUserData(null);
                }
            } else {
                // Si no hay usuario, limpia el estado.
                setCurrentUserData(null);
            }
            setIsLoading(false); // Finaliza el estado de carga.
        });

        // Limpia el listener al desmontar el componente.
        return () => unsubscribe();
    }, [auth, isLoginPage, router, getDashboardPath]);
    
    // Hook de efecto para redirigir al login si no hay usuario autenticado.
    useEffect(() => {
        if (!isLoading && !currentUserData && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isLoading, currentUserData, pathname, router]);

     // Hook de efecto para manejar el temporizador de inactividad.
     useEffect(() => {
        if (!currentUserData) return;

        let inactivityTimer: NodeJS.Timeout;

        // Reinicia el temporizador con cada actividad del usuario.
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                handleLogout(true); // Cierra sesión por inactividad.
            }, INACTIVITY_TIMEOUT);
        };

        // Escucha eventos de actividad en la ventana.
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('mousedown', resetTimer);
        window.addEventListener('touchstart', resetTimer);

        resetTimer(); // Inicia el temporizador.

        // Limpia los listeners al desmontar.
        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('mousedown', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
        };
    }, [currentUserData, handleLogout]);

    // Muestra una pantalla de carga mientras se verifica la autenticación.
    if (isLoading) {
        return <LoadingScreen />;
    }

    // Si no está autenticado, solo renderiza la página de login sin el layout principal.
    if (!currentUserData || isLoginPage) {
        return <>{children}</>;
    }
    
    // Para la vista de impresión, renderiza solo el contenido sin layout.
    if (isPrintPage) {
        return <>{children}</>;
    }

    const currentUserRole = currentUserData.role;
    
    // Función para obtener la ruta correcta del dashboard según el rol del usuario.
    const getRoleBasedPath = (basePath: string) => {
        if (basePath === '/dashboard') {
            return getDashboardPath(currentUserRole);
        }
        return `${basePath}`;
    }
    
    // Filtra los elementos del menú según el rol del usuario actual.
    const currentMenuItems = allMenuItems.filter(item => item.roles.includes(currentUserRole));

    return (
        // Proveedor de contexto para que los datos del usuario estén disponibles en toda la app.
        <UserProvider value={currentUserData}>
            <SidebarProvider>
                <Sidebar>
                    <SidebarHeader className="flex items-center justify-center">
                        <Link href={getRoleBasedPath('/dashboard')}>
                            <Logo />
                        </Link>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {currentMenuItems.map((item) => {
                                 // Renderiza separadores o ítems de menú.
                                 if (item.isSection || !item.href || !item.icon) {
                                    return <SidebarSeparator key={item.label} className="my-1" />;
                                }
                                const RoleIcon = item.icon
                                
                                let isActive = false;
                                
                                // Lógica compleja para determinar qué ítem de menú está activo.
                                const isFinishedProductPage = pathname.startsWith('/production/finished-product');
                                const isScalesPage = pathname.startsWith('/quality/scales');
                                
                                if (item.href.includes('flow=powder') && (isFinishedProductPage || (isScalesPage && pathname.includes('/powders')))) {
                                    isActive = true;
                                } else if (item.href === '/production' && (isFinishedProductPage || isScalesPage)) {
                                    isActive = false; // Desactiva "Producción" en páginas específicas de calidad.
                                } else if (item.href.startsWith('/quality')) {
                                    const flow = searchParams.get('flow');
                                    isActive = pathname.startsWith('/quality') && item.href.includes(`flow=${flow}`);
                                } else if (item.href === '/production') {
                                    isActive = pathname.startsWith('/production') || pathname.startsWith('/formulations');
                                } else {
                                    isActive = pathname.startsWith(item.href);
                                }

                                return (
                                    <SidebarMenuItem key={item.label}>
                                        <Link href={getRoleBasedPath(item.href)} className="w-full">
                                            <SidebarMenuButton
                                            isActive={isActive}
                                            icon={<RoleIcon />}
                                            tooltip={item.label}
                                            >
                                            {item.label}
                                            </SidebarMenuButton>
                                        </Link>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter className="hidden group-data-[state=expanded]:block">
                        <Separator className="mb-2" />
                        <p className="px-2 text-xs text-muted-foreground">© 2024 Tropical Trace</p>
                    </SidebarFooter>
                </Sidebar>
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
                                            <p className="text-xs leading-none text-muted-foreground">
                                                {currentUserData.email}
                                            </p>
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
    )
}

/**
 * Componente raíz del layout que configura el HTML base, fuentes, y proveedores de temas y notificaciones.
 */
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
