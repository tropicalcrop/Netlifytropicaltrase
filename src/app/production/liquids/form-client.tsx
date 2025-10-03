

'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, getById } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Trash2, ArrowLeft, Minus, Plus, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCurrentUser } from "@/context/UserContext"
import { Textarea } from "@/components/ui/textarea"
import SignaturePad from "@/components/signature-pad"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ProductionData, type ProductionIngredient, type PackagingMaterial, type ProductionStage } from "../../page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link'
import { ScrollArea } from "@/components/ui/scroll-area"
import { sendNotification } from "@/services/notificationService"

const COLLECTION_NAME = "production"

interface LiquidProductionFormClientPageProps {
    logId?: string;
    isPrintView?: boolean;
}

export default function LiquidProductionFormClientPage({ logId, isPrintView = false }: LiquidProductionFormClientPageProps) {
    const currentUser = useCurrentUser()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [formData, setFormData] = useState<Partial<ProductionData>>({});
    const [isSaving, setIsSaving] = useState(false)

    const isEditing = !!logId;
    const isPreview = searchParams.get('preview') === 'true' || isPrintView;
    const cloneFromId = searchParams.get('cloneFrom');

    const backLink = formData.item ? `/production/${formData.item}` : '/production/liquids';

    useEffect(() => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];

        const initialData: Partial<ProductionData> = {
            date,
            type: 'liquid',
            status: "Pendiente",
            responsible: { name: currentUser?.name, id: currentUser?.id, role: currentUser?.role },
            signature: "",
            supervisorSignature: "",
            stages: [{ name: 'Pre-Mezcla 1', ingredients: [] }],
            packagingMaterials: [],
        };
        
        const loadFormData = async () => {
            if (isEditing) {
                const log = await getById<ProductionData>(COLLECTION_NAME, logId!);
                 if (log) {
                    setFormData(log)
                } else {
                    toast({variant: "destructive", title: "Error", description: "No se encontró el registro a editar."})
                    router.push(backLink);
                }
            } else if (cloneFromId) {
                const logToClone = await getById<ProductionData>(COLLECTION_NAME, cloneFromId);
                if(logToClone) {
                    const { id, lot, date, signature, supervisorSignature, ...rest } = logToClone;
                    setFormData({
                        ...rest,
                        ...initialData
                    });
                } else {
                     setFormData(initialData)
                }
            } else {
                setFormData(initialData)
            }
        };

        loadFormData();

    }, [isEditing, logId, cloneFromId, currentUser, router, toast, backLink]);

    const handleInputChange = (field: keyof ProductionData | 'responsibleVerification.name', value: any) => {
        if(field === 'responsibleVerification.name') {
            setFormData(prev => ({ ...prev, responsibleVerification: { ...(prev.responsibleVerification || {}), name: value } }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };
    
    const handleStageChange = (stageIndex: number, field: keyof ProductionStage, value: any) => {
        const updatedStages = [...(formData.stages || [])];
        (updatedStages[stageIndex] as any)[field] = value;
        setFormData(prev => ({ ...prev, stages: updatedStages }));
    };

    const handleIngredientChange = (stageIndex: number, ingIndex: number, field: keyof ProductionIngredient, value: any) => {
        setFormData(prev => {
            const newStages = JSON.parse(JSON.stringify(prev.stages || []));
            if (!newStages[stageIndex].ingredients) {
                newStages[stageIndex].ingredients = [];
            }
            (newStages[stageIndex].ingredients[ingIndex] as any)[field] = value;
            return { ...prev, stages: newStages };
        });
    };
    
    const addStage = () => {
        const newStage: ProductionStage = { name: `Etapa ${ (formData.stages?.length || 0) + 1 }`, ingredients: [] };
        setFormData(prev => ({ ...prev, stages: [...(prev.stages || []), newStage]}));
    };

    const removeStage = (stageIndex: number) => {
        setFormData(prev => ({...prev, stages: (prev.stages || []).filter((_, i) => i !== stageIndex) }));
    };

    const addIngredient = (stageIndex: number) => {
        const newIngredient: ProductionIngredient = { ref: '', name: '', quantity: 0, unit: 'kg', lot: '', check: null, adjustment: null, responsible: { name: ''}, tare: 0, attentionTo: '' };
        
        setFormData(prev => {
            const updatedStages = JSON.parse(JSON.stringify(prev.stages || []));
            if (!updatedStages[stageIndex].ingredients) {
                updatedStages[stageIndex].ingredients = [];
            }
            updatedStages[stageIndex].ingredients.push(newIngredient);
            return { ...prev, stages: updatedStages };
        });
    };

    const removeIngredient = (stageIndex: number, ingIndex: number) => {
        setFormData(prev => {
            const newStages = [...(prev.stages || [])];
            const ingredients = (newStages[stageIndex].ingredients || []).filter((_, i) => i !== ingIndex);
            newStages[stageIndex].ingredients = ingredients;
            return { ...prev, stages: newStages };
        });
    };
    
     const handlePackagingChange = (index: number, field: keyof PackagingMaterial, value: any) => {
        setFormData(prev => {
            const updatedMaterials = [...(prev.packagingMaterials || [])];
            (updatedMaterials[index] as any)[field] = value;
            return { ...prev, packagingMaterials: updatedMaterials };
        });
    };

    const addPackagingMaterial = () => {
        const newMaterial: PackagingMaterial = { product: '', ref: '', quantity: 0, unit: 'Und', lot: '' };
        setFormData(prev => ({...prev, packagingMaterials: [...(prev.packagingMaterials || []), newMaterial]}));
    };

    const removePackagingMaterial = (index: number) => {
        setFormData(prev => ({...prev, packagingMaterials: (prev.packagingMaterials || []).filter((_, i) => i !== index) }));
    };


    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const newData: ProductionData = {
                ...formData,
                id: logId || formData.id || Date.now().toString(),
            };
            const savedData = await addOrUpdate(COLLECTION_NAME, newData)
            
            if (!isEditing && currentUser) {
                 await sendNotification({
                    title: 'Nuevo Lote Líquido Registrado',
                    message: `Se ha creado el lote ${savedData.lot} para el producto ${savedData.product}.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'all',
                    link: `/production/${savedData.item}`
                });
            }

            toast({title: "Éxito", description: `Lote de producción ${newData.lot} guardado.`})
            router.push(`/production/${savedData.item}`);
        } catch (error) {
            toast({variant: "destructive", title: "Error", description: "No se pudo guardar el lote."})
        } finally {
            setIsSaving(false)
        }
    };
    
    const Wrapper = isPrintView ? 'div' : PageHeader;
    const FormWrapper = isPrintView ? 'div' : ScrollArea;
    const formWrapperProps = isPrintView ? {} : { className: "h-[calc(100vh-220px)]" };

    return (
        <>
            <Wrapper title={isEditing ? "Editar Fabricación de Lote Líquido" : "Registrar Fabricación de Lote Líquido"}>
                 {!isPrintView && (
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={backLink}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cancelar
                            </Link>
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {isSaving ? "Guardando..." : "Guardar Fabricación"}
                        </Button>
                    </div>
                 )}
            </Wrapper>
            <FormWrapper {...formWrapperProps}>
                <div className="space-y-6 pb-6 p-1">
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>Información General del Lote</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="product">Producto</Label>
                                <Input id="product" value={formData.product || ''} onChange={(e) => handleInputChange('product', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="item">Item</Label>
                                <Input id="item" value={formData.item || ''} onChange={(e) => handleInputChange('item', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="lot">Lote</Label>
                                <Input id="lot" value={formData.lot || ''} onChange={(e) => handleInputChange('lot', e.target.value)} placeholder="Ingrese el número de lote" disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="carga">Carga</Label>
                                <Input id="carga" value={formData.carga || ''} onChange={(e) => handleInputChange('carga', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cliente">Cliente</Label>
                                <Input id="cliente" value={formData.cliente || ''} onChange={(e) => handleInputChange('cliente', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="orden">Orden</Label>
                                <Input id="orden" value={formData.orden || ''} onChange={(e) => handleInputChange('orden', e.target.value)} disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label>Fecha</Label>
                                <Input value={formData.date || ''} readOnly className="bg-muted" disabled={isPreview}/>
                            </div>
                            <div className="grid gap-2">
                                <Label>Responsable Fabricación</Label>
                                <Input value={formData.responsible?.name || ''} readOnly className="bg-muted" disabled={isPreview}/>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {(formData.stages || []).map((stage, stageIndex) => (
                        <Card className="rounded-xl" key={stageIndex}>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <Input 
                                        value={stage.name || ''} 
                                        onChange={(e) => handleStageChange(stageIndex, 'name', e.target.value)} 
                                        placeholder="Nombre de la Etapa"
                                        className="text-lg font-semibold border-none shadow-none p-0 focus-visible:ring-0"
                                        disabled={isPreview}
                                    />
                                    {!isPreview && <Button variant="ghost" size="sm" onClick={() => removeStage(stageIndex)}>Quitar Etapa</Button>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Hora Inicio</Label>
                                        <Input 
                                            type="time" 
                                            value={stage.startTime || ''} 
                                            onChange={(e) => handleStageChange(stageIndex, 'startTime', e.target.value)} 
                                            disabled={isPreview || currentUser?.role !== 'Production'}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Hora Fin</Label>
                                        <Input 
                                            type="time" 
                                            value={stage.endTime || ''} 
                                            onChange={(e) => handleStageChange(stageIndex, 'endTime', e.target.value)} 
                                            disabled={isPreview || currentUser?.role !== 'Production'}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table className="responsive-table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Referencia</TableHead>
                                            <TableHead>Ingrediente</TableHead>
                                            <TableHead>Tarado</TableHead>
                                            <TableHead>Cantidad</TableHead>
                                            <TableHead>Lote</TableHead>
                                            <TableHead>Ajuste</TableHead>
                                            <TableHead>Atención a</TableHead>
                                            <TableHead>Firma</TableHead>
                                            {!isPreview && <TableHead>Acción</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(stage.ingredients || []).map((ing, ingIndex) => (
                                            <TableRow key={ingIndex}>
                                                <TableCell data-label="Referencia"><Input value={ing.ref || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'ref', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Ingrediente"><Input value={ing.name || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'name', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Tarado"><Input type="number" value={ing.tare || 0} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'tare', parseFloat(e.target.value))} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Cantidad"><Input type="number" value={ing.quantity || 0} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'quantity', parseFloat(e.target.value))} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Lote"><Input value={ing.lot || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'lot', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Ajuste">
                                                    <div className="flex gap-1">
                                                        <Button size="icon" variant={ing.adjustment === '+' ? 'default' : 'outline'} onClick={() => !isPreview && handleIngredientChange(stageIndex, ingIndex, 'adjustment', '+')} disabled={isPreview}><Plus className="h-4 w-4"/></Button>
                                                        <Button size="icon" variant={ing.adjustment === '-' ? 'destructive' : 'outline'} onClick={() => !isPreview && handleIngredientChange(stageIndex, ingIndex, 'adjustment', '-')} disabled={isPreview}><Minus className="h-4 w-4"/></Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell data-label="Atención a"><Textarea value={ing.attentionTo || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'attentionTo', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Firma"><Input placeholder="Firma resp." value={ing.responsible?.name || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'responsible', { ...(ing.responsible || {}), name: e.target.value })} disabled={isPreview}/></TableCell>
                                                {!isPreview && <TableCell data-label="Acción"><Button variant="ghost" size="icon" onClick={() => removeIngredient(stageIndex, ingIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {!isPreview && <Button variant="ghost" size="sm" onClick={() => addIngredient(stageIndex)} className="mt-2"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingrediente</Button>}
                            </CardContent>
                        </Card>
                    ))}
                    {!isPreview && <Button variant="secondary" size="sm" onClick={addStage} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Etapa</Button>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-xl">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><CardTitle>Material de Empaque</CardTitle>{!isPreview && <Button size="sm" onClick={addPackagingMaterial}><PlusCircle className="mr-2 h-4 w-4" /> Añadir</Button>}</div>
                            </CardHeader>
                            <CardContent>
                                <Table className="responsive-table">
                                    <TableHeader><TableRow><TableHead>Ref.</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Unidad</TableHead><TableHead>Lote</TableHead>{!isPreview && <TableHead>Acción</TableHead>}</TableRow></TableHeader>
                                    <TableBody>
                                        {(formData.packagingMaterials || []).map((mat, index) => (
                                            <TableRow key={index}>
                                                <TableCell data-label="Ref."><Input value={mat.ref || ''} onChange={e => handlePackagingChange(index, 'ref', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Producto"><Input value={mat.product || ''} onChange={e => handlePackagingChange(index, 'product', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Cantidad"><Input type="number" value={mat.quantity || 0} onChange={e => handlePackagingChange(index, 'quantity', parseFloat(e.target.value))} className="w-24" disabled={isPreview}/></TableCell>
                                                <TableCell data-label="Unidad"><Input value={mat.unit || 'Und'} readOnly disabled className="bg-muted" /></TableCell>
                                                <TableCell data-label="Lote"><Input value={mat.lot || ''} onChange={e => handlePackagingChange(index, 'lot', e.target.value)} disabled={isPreview}/></TableCell>
                                                {!isPreview && <TableCell data-label="Acción"><Button variant="destructive" size="icon" onClick={() => removePackagingMaterial(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl">
                            <CardHeader><CardTitle>Producto Final Teórico</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Cantidad (kg)</Label><Input type="number" value={formData.finalProductTheoretical || 0} onChange={e => handleInputChange('finalProductTheoretical', parseFloat(e.target.value))} disabled={isPreview}/></div>
                                    <div className="space-y-2">
                                        <Label>Responsable Verificación</Label>
                                        <Input placeholder="Firma o Nombre" value={formData.responsibleVerification?.name || ''} onChange={(e) => handleInputChange('responsibleVerification.name', e.target.value)} disabled={isPreview}/>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>Firmas y Observaciones</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label className="text-center block">Quien Formula</Label><SignaturePad onSave={v => handleInputChange('signature', v)} initialSignature={formData.signature} disabled={isPreview}/></div>
                                <div className="space-y-2"><Label className="text-center block">Quien Revisa</Label><SignaturePad onSave={v => handleInputChange('supervisorSignature', v)} initialSignature={formData.supervisorSignature} disabled={isPreview}/></div>
                            </div>
                            <div className="grid gap-2"><Label>Observaciones</Label><Textarea value={formData.observations || ''} onChange={(e) => handleInputChange('observations', e.target.value)} disabled={isPreview}/></div>
                        </CardContent>
                    </Card>
                </div>
            </FormWrapper>
        </>
    )
}
