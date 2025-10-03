

'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, getById } from "@/services/firestoreService"
import { type UserData } from "@/types/users"
import { createUserWithoutSignIn, sendPasswordReset } from "@/services/authService"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from 'next/link'
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const COLLECTION_NAME = "users"

const userSchemaBase = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico no válido"),
  role: z.enum(["Administrator", "Quality", "Production"]),
  documentType: z.enum(["CC", "CE", "TI", "PASS"]),
  documentNumber: z.string().min(5, "El número de documento debe tener al menos 5 caracteres"),
  avatarUrl: z.string().url("URL de avatar no válida").optional().or(z.literal('')),
})

const passwordSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

const createUserSchema = userSchemaBase.merge(passwordSchema);

interface UserFormPageProps {
    userId?: string;
}

export default function UserFormPage({ userId }: UserFormPageProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false);
    const isEditing = !!userId;

    const formSchema = isEditing ? userSchemaBase : createUserSchema;

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "", email: "", role: "Production" as "Production", documentType: "CC" as "CC",
            documentNumber: "", avatarUrl: "", password: "", confirmPassword: ""
        },
    })

    useEffect(() => {
        if (isEditing) {
            getById<UserData>(COLLECTION_NAME, userId).then(user => {
                if(user) {
                    form.reset({
                        name: user.name, email: user.email, role: user.role,
                        documentType: user.documentType, documentNumber: user.documentNumber,
                        avatarUrl: user.avatarUrl,
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Error', description: 'Usuario no encontrado.' });
                    router.push('/users');
                }
            })
        }
    }, [isEditing, userId, form, router, toast]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            if (isEditing) {
                await addOrUpdate<Partial<UserData>>(COLLECTION_NAME, { ...values, id: userId });
                toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
            } else {
                const password = (values as any).password;
                if (!password) {
                    toast({ variant: "destructive", title: "Error", description: "La contraseña es obligatoria para crear un usuario." });
                    return;
                }
                const userCredential = await createUserWithoutSignIn(values.email!, password);
                const uid = userCredential.user.uid;
                
                const newUserWithId: UserData = { ...values, id: uid, uid: uid } as UserData;
                await addOrUpdate<UserData>(COLLECTION_NAME, newUserWithId);
                
                toast({ title: "Éxito", description: `Usuario creado correctamente.` });
            }
            router.push('/users');
        } catch (error: any) {
            console.error(error);
            let message = "No se pudo guardar el usuario.";
            if (error.code === 'auth/email-already-in-use') {
                message = "El correo electrónico ya está en uso."
            }
            toast({ variant: "destructive", title: "Error al crear usuario", description: message });
        } finally {
            setIsSaving(false);
        }
    }

    const handlePasswordReset = async () => {
        const email = form.getValues('email');
        if(!email) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se encontró el correo del usuario para enviar el enlace.' });
            return;
        }
        setIsSaving(true);
        try {
            await sendPasswordReset(email);
            toast({ title: 'Éxito', description: 'Se ha enviado un correo de recuperación al usuario.' });
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || "No se pudo enviar el correo de recuperación."})
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <PageHeader title={isEditing ? "Editar Usuario" : "Crear Usuario"}>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/users">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Guardar Cambios
                    </Button>
                </div>
            </PageHeader>
            <div className="max-w-2xl mx-auto">
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>Información del Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input id="name" {...form.register("name")} />
                                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input id="email" type="email" {...form.register("email")} disabled={isEditing} />
                                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="avatarUrl">URL de Avatar (Opcional)</Label>
                                <Input id="avatarUrl" {...form.register("avatarUrl")} />
                                {form.formState.errors.avatarUrl && <p className="text-xs text-destructive">{form.formState.errors.avatarUrl.message}</p>}
                            </div>
                            {!isEditing && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Contraseña</Label>
                                            <Input id="password" type="password" {...form.register("password")} />
                                            {form.formState.errors.password && <p className="text-xs text-destructive">{(form.formState.errors.password as any).message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
                                            {form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{(form.formState.errors.confirmPassword as any).message}</p>}
                                        </div>
                                    </div>
                                )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                <Label>Tipo de Documento</Label>
                                <Controller
                                    control={form.control}
                                    name="documentType"
                                    render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                        <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                                        <SelectItem value="PASS">Pasaporte</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    )}
                                />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="documentNumber">Número de Documento</Label>
                                <Input id="documentNumber" {...form.register("documentNumber")} />
                                {form.formState.errors.documentNumber && <p className="text-xs text-destructive">{form.formState.errors.documentNumber.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Rol</Label>
                                <Controller
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Administrator">Administrador</SelectItem>
                                        <SelectItem value="Quality">Calidad</SelectItem>
                                        <SelectItem value="Production">Producción</SelectItem>
                                    </SelectContent>
                                    </Select>
                                )}
                                />
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {isEditing && (
                    <Card className="mt-6 rounded-xl">
                        <CardHeader>
                            <CardTitle>Recuperar Contraseña</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-col gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Al hacer clic en el botón, se enviará un correo electrónico al usuario con un enlace para que pueda restablecer su contraseña.
                                </p>
                                <Button onClick={handlePasswordReset} disabled={isSaving} className="w-full sm:w-auto">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Enviar Correo de Recuperación
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    )
}
