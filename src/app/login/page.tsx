
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, setPersistence, signInWithEmailAndPassword, browserSessionPersistence, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useCurrentUser } from '@/context/UserContext';
import { LoadingScreen } from '@/components/LoadingScreen';
import { type UserData } from '@/app/users/page';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const { toast } = useToast();
    const router = useRouter();
    const auth = getAuth(app);
    const currentUser = useCurrentUser();

    const getDashboardPath = useCallback((role?: UserData['role']) => {
        if (!role) return '/login';
        const rolePath = role.toLowerCase();
        return `/dashboard/${rolePath}`;
    }, []);

    useEffect(() => {
        if (currentUser) {
            router.replace(getDashboardPath(currentUser.role));
        } else {
            setIsCheckingAuth(false);
        }
    }, [currentUser, router, getDashboardPath]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: "Inicio de sesión exitoso",
                description: `Bienvenido de nuevo. Redirigiendo...`,
            });
        } catch (error: any) {
            let description = "Ha ocurrido un error inesperado.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = "El correo o la contraseña son incorrectos.";
            } else if (error.code === 'auth/too-many-requests') {
                description = 'El acceso a esta cuenta ha sido temporalmente deshabilitado. Puede restablecer su contraseña o volver a intentarlo más tarde.';
            }
            toast({
                variant: "destructive",
                title: "Error al iniciar sesión",
                description: description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!resetEmail) {
            toast({
                variant: "destructive",
                title: "Correo requerido",
                description: "Por favor, introduce tu correo electrónico.",
            });
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            toast({
                title: "Solicitud enviada",
                description: "Si existe una cuenta, recibirás un correo. Revisa tu bandeja de entrada y la carpeta de spam.",
                duration: 6000,
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return <LoadingScreen />;
    }

    return (
        <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
            <div className="hidden bg-primary lg:flex items-center justify-center">
                <Logo className="w-[300px] h-[60px]" />
            </div>
            <div className="flex items-center justify-center p-6 py-12 bg-background">
                 <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg bg-transparent sm:bg-card sm:text-card-foreground">
                    <CardHeader className="text-center sm:text-left">
                        <div className="w-full flex justify-center mb-4 sm:hidden">
                           <Logo className="w-[300px] h-[60px]" />
                        </div>
                        <CardTitle className="text-2xl">Bienvenido de Nuevo</CardTitle>
                        <CardDescription>Introduce tu correo y contraseña para acceder al sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@ejemplo.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link" className="ml-auto text-xs h-auto p-0">¿Olvidaste tu contraseña?</Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Restablecer Contraseña</DialogTitle>
                                                <DialogDescription>
                                                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="reset-email" className="text-right">Correo</Label>
                                                    <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="col-span-3" placeholder="tu@correo.com" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                                <Button onClick={handlePasswordReset} disabled={isLoading}>
                                                    {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
