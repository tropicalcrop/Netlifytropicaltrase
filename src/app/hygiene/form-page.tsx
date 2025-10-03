

'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, getById, getAll } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { useCurrentUser } from "@/context/UserContext"
import SignaturePad from "@/components/signature-pad"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type HygieneData } from "../hygiene/page"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { sendNotification } from "@/services/notificationService"
import { type ProductionData } from "../production/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface HygieneFormPageProps {
    logId?: string;
    isPrintView?: boolean;
    collectionName: string;
}

export default function HygieneFormPage({ logId, isPrintView = false, collectionName = 'hygiene' }: HygieneFormPageProps) {
    const currentUser = useCurrentUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast()

    const [formData, setFormData] = useState<Partial<HygieneData>>({});
    const [productionLots, setProductionLots] = useState<ProductionData[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const isPreview = searchParams.get('preview') === 'true' || isPrintView;
    const isEditing = !!logId;
    const isLiquids = collectionName.includes('liquids');
    
    useEffect(() => {
        const fetchLots = async () => {
            const lots = await getAll<ProductionData>('production');
            const sortedLots = lots.sort((a,b) => (a.productionOrder ?? Infinity) - (b.productionOrder ?? Infinity));
            const flowType = isLiquids ? 'liquid' : 'powder';
            setProductionLots(sortedLots.filter(lot => lot.type === flowType));
        };
        fetchLots();
    }, [isLiquids]);

    useEffect(() => {
        if (!isEditing && productionLots.length > 0) {
            const nextLotInQueue = productionLots.find(lot => lot.productionOrder != null && lot.status !== 'Completado');
            if (nextLotInQueue) {
                const selectedIndex = productionLots.findIndex(lot => lot.id === nextLotInQueue.id);
                const previousLot = selectedIndex > 0 ? productionLots[selectedIndex - 1] : null;

                setFormData(prev => ({
                    ...prev,
                    product: nextLotInQueue.product,
                    lot: nextLotInQueue.lot,
                    item: nextLotInQueue.item,
                    charge: nextLotInQueue.carga,
                    client: nextLotInQueue.cliente,
                    order: nextLotInQueue.orden,
                    lastFabricationProduct: previousLot ? `${previousLot.item} - ${previousLot.product}` : '',
                    lastFabricationLot: previousLot ? previousLot.lot : '',
                }));
            }
        }
    }, [productionLots, isEditing]);

    useEffect(() => {
        if (isEditing) {
            getById<HygieneData>(collectionName, logId).then(log => {
                if(log) {
                    setFormData(log);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "No se encontró el registro." });
                    router.push('/hygiene');
                }
            })
        } else {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().split(' ')[0].slice(0, 5);
            setFormData({
                date,
                startTime: time,
                status: 'Pendiente',
                responsible: { name: currentUser?.name, id: currentUser?.id, role: currentUser?.role },
                signature: "",
                product: '',
                lot: '',
                charge: '',
                client: '',
                order: '',
                allergen: 'NO',
            });
        }
    }, [isEditing, logId, currentUser, router, toast, collectionName]);

    const handleLotSelection = (lotId: string) => {
        const selectedLot = productionLots.find(lot => lot.id === lotId);
        const selectedIndex = productionLots.findIndex(lot => lot.id === lotId);
        
        if (selectedLot) {
            const previousLot = selectedIndex > 0 ? productionLots[selectedIndex - 1] : null;

            setFormData(prev => ({
                ...prev,
                product: selectedLot.product,
                lot: selectedLot.lot,
                item: selectedLot.item,
                charge: selectedLot.carga,
                client: selectedLot.cliente,
                order: selectedLot.orden,
                lastFabricationProduct: previousLot ? `${previousLot.item} - ${previousLot.product}` : '',
                lastFabricationLot: previousLot ? previousLot.lot : '',
            }));
        }
    };

    const handleInputChange = (field: keyof HygieneData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const dataToSave: Partial<HygieneData> = { ...formData };

            if (dataToSave.status === 'Verificado') {
                dataToSave.verifier = formData.verifier || { id: currentUser?.id, name: currentUser?.name, role: currentUser?.role };
            } else {
                delete dataToSave.verifier;
            }

            if (isEditing) {
                dataToSave.id = logId;
            }

            const savedData = await addOrUpdate(collectionName, dataToSave as HygieneData);

             if (!isEditing && currentUser) {
                const flowType = isLiquids ? 'Líquidos' : 'Polvos';
                await sendNotification({
                    title: `Limpieza Pendiente (${flowType})`,
                    message: `La limpieza para "${savedData.product}" (Lote: ${savedData.lot}) requiere verificación.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'Quality', // Notify all Quality users
                    link: isLiquids ? `/quality/hygiene/liquids` : `/quality/hygiene/powders`
                });
                 await sendNotification({
                    title: `Limpieza Registrada (${flowType})`,
                    message: `${currentUser.name} registró una nueva limpieza para "${savedData.product}".`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'Administrator', // Also notify Admins
                    link: isLiquids ? `/quality/hygiene/liquids` : `/quality/hygiene/powders`
                });
            }


            toast({ title: "Éxito", description: `Registro de higiene para "${savedData.product}" guardado.` })
            router.push(isLiquids ? `/quality/hygiene/liquids` : `/quality/hygiene/powders`);
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro." })
        } finally {
            setIsSaving(false);
        }
    };
    
    const Wrapper = isPrintView ? 'div' : PageHeader;
    const FormWrapper = isPrintView ? 'div' : ScrollArea;
    const formWrapperProps = isPrintView ? {} : { className: "h-[calc(100vh-220px)]" };
    const backLink = isLiquids ? '/quality/hygiene/liquids' : '/quality/hygiene/powders';

    return (
        <>
            <Wrapper title={isPreview ? 'Vista Previa' : isEditing ? 'Editar' : 'Registrar Actividad de Limpieza'}>
                {!isPrintView && (
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={backLink}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        {!isPreview && (
                            <Button onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isSaving ? "Guardando..." : "Guardar Registro"}
                            </Button>
                        )}
                    </div>
                )}
            </Wrapper>
            <FormWrapper {...formWrapperProps}>
                <div className="space-y-6 max-w-4xl mx-auto p-1">
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>Detalles Generales del Ciclo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2 md:col-span-3">
                                    <Label>Lote de Producción (Opcional)</Label>
                                    <Select onValueChange={handleLotSelection} disabled={isPreview || isEditing}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Seleccionar un lote de ${isLiquids ? 'líquidos' : 'polvos'} para autocompletar...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productionLots.map(lot => (
                                                <SelectItem key={lot.id} value={lot.id!}>
                                                    {lot.lot} - {lot.product}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="item">Item</Label>
                                    <Input id="item" value={formData.item || ''} onChange={(e) => handleInputChange('item', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product">Producto</Label>
                                    <Input id="product" value={formData.product || ''} onChange={(e) => handleInputChange('product', e.target.value)} disabled={isPreview}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="lot">Lote</Label>
                                    <Input id="lot" value={formData.lot || ''} onChange={(e) => handleInputChange('lot', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="charge">Carga</Label>
                                    <Input id="charge" value={formData.charge || ''} onChange={(e) => handleInputChange('charge', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="client">Cliente</Label>
                                    <Input id="client" value={formData.client || ''} onChange={(e) => handleInputChange('client', e.target.value)} disabled={isPreview}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="order">Orden</Label>
                                    <Input id="order" value={formData.order || ''} onChange={(e) => handleInputChange('order', e.target.value)} disabled={isPreview}/>
                                </div>
                                 <div className="space-y-2">
                                    <Label>Fecha</Label>
                                    <Input value={`${formData.date || ''}`} readOnly disabled className="bg-muted"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>I. Registro de la última fabricación en el área</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label>Item-Producto</Label>
                                 <Input id="lastFabricationProduct" value={formData.lastFabricationProduct || ''} onChange={(e) => handleInputChange('lastFabricationProduct', e.target.value)} disabled={isPreview}/>
                            </div>
                             <div className="space-y-2">
                                <Label>Lote</Label>
                                 <Input id="lastFabricationLot" value={formData.lastFabricationLot || ''} onChange={(e) => handleInputChange('lastFabricationLot', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>¿Contiene Alérgeno?</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('allergen', v as 'SI'|'NO')} value={formData.allergen} className="flex space-x-4 pt-2" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="allergen-yes"/><Label htmlFor="allergen-yes">Sí</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="allergen-no"/><Label htmlFor="allergen-no">No</Label></div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                   
                    <Card className="rounded-xl">
                        <CardHeader>
                             <CardTitle>II. Limpieza y Desinfección</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="detergentUsed">Detergente Usado</Label>
                                    <Input id="detergentUsed" value={formData.detergentUsed || ''} onChange={(e) => handleInputChange('detergentUsed', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="detergentLot">Lote</Label>
                                    <Input id="detergentLot" value={formData.detergentLot || ''} onChange={(e) => handleInputChange('detergentLot', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="detergentConcentration">Concentración</Label>
                                    <Input id="detergentConcentration" value={formData.detergentConcentration || ''} onChange={(e) => handleInputChange('detergentConcentration', e.target.value)} disabled={isPreview}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <Label htmlFor="disinfectantUsed">Desinfectante Usado</Label>
                                    <Input id="disinfectantUsed" value={formData.disinfectantUsed || ''} onChange={(e) => handleInputChange('disinfectantUsed', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disinfectantLot">Lote</Label>
                                    <Input id="disinfectantLot" value={formData.disinfectantLot || ''} onChange={(e) => handleInputChange('disinfectantLot', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disinfectantConcentration">Concentración</Label>
                                    <Input id="disinfectantConcentration" value={formData.disinfectantConcentration || ''} onChange={(e) => handleInputChange('disinfectantConcentration', e.target.value)} disabled={isPreview}/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>Observaciones y Firma</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Observaciones</Label>
                                <Textarea value={formData.observations || ''} onChange={(e) => handleInputChange('observations', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-center block">Firma del Responsable</Label>
                                <SignaturePad onSave={v => handleInputChange('signature', v)} initialSignature={formData.signature} disabled={isPreview}/>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </FormWrapper>
        </>
    )
}
