
'use client'

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, getById, getAll } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Trash2, ArrowLeft, Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/context/UserContext"
import { type Formulation } from "../../../formulations/client-page"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import SignaturePad from "@/components/signature-pad"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ProductionData, type ProductionIngredient, type PackagingMaterial, type ProductionStage } from "../../page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link'

const COLLECTION_NAME = "production"

interface LiquidProductionFormClientPageProps {
    logId?: string;
    formulations: Formulation[];
}

export default function LiquidProductionFormClientPage({ logId, formulations }: LiquidProductionFormClientPageProps) {
    const currentUser = useCurrentUser()
    const router = useRouter()
    const { toast } = useToast()
    const [formData, setFormData] = useState<Partial<ProductionData>>({});
    const [isSaving, setIsSaving] = useState(false)

    const isEditing = !!logId;

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
        
        if (isEditing) {
            getById<ProductionData>(COLLECTION_NAME, logId).then(log => {
                if (log) {
                    setFormData(log)
                } else {
                    toast({variant: "destructive", title: "Error", description: "No se encontró el registro a editar."})
                    router.push('/production/liquids');
                }
            })
        } else {
            setFormData(initialData)
        }
    }, [isEditing, logId, currentUser, router, toast]);

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
        const updatedStages = [...(formData.stages || [])];
        if(!updatedStages[stageIndex].ingredients){
            updatedStages[stageIndex].ingredients = [];
        }
        (updatedStages[stageIndex].ingredients[ingIndex] as any)[field] = value;
        setFormData(prev => ({ ...prev, stages: updatedStages }));
    };
    
    const addStage = () => {
        const newStage: ProductionStage = { name: `Etapa ${ (formData.stages?.length || 0) + 1 }`, ingredients: [] };
        setFormData(prev => ({ ...prev, stages: [...(prev.stages || []), newStage]}));
    };

    const removeStage = (stageIndex: number) => {
        setFormData(prev => ({...prev, stages: prev.stages?.filter((_, i) => i !== stageIndex) }));
    };

    const addIngredient = (stageIndex: number) => {
        const newIngredient: ProductionIngredient = { ref: '', name: '', quantity: 0, unit: 'kg', lot: '', check: null, adjustment: null, responsible: { name: ''}, tare: 0, attentionTo: '' };
        const updatedStages = [...(formData.stages || [])];
        if (!updatedStages[stageIndex].ingredients) {
            updatedStages[stageIndex].ingredients = [];
        }
        updatedStages[stageIndex].ingredients.push(newIngredient);
        setFormData(prev => ({...prev, stages: updatedStages}));
    };

    const removeIngredient = (stageIndex: number, ingIndex: number) => {
        const updatedStages = [...(formData.stages || [])];
        if(updatedStages[stageIndex].ingredients) {
            updatedStages[stageIndex].ingredients = updatedStages[stageIndex].ingredients.filter((_, i) => i !== ingIndex);
            setFormData(prev => ({...prev, stages: updatedStages}));
        }
    };
    
     const handlePackagingChange = (index: number, field: keyof PackagingMaterial, value: any) => {
        const updatedMaterials = [...(formData.packagingMaterials || [])];
        (updatedMaterials[index] as any)[field] = value;
        setFormData(prev => ({...prev, packagingMaterials: updatedMaterials}));
    };

    const addPackagingMaterial = () => {
        const newMaterial: PackagingMaterial = { product: '', ref: '', quantity: 0, unit: 'Und', lot: '' };
        setFormData(prev => ({...prev, packagingMaterials: [...(prev.packagingMaterials || []), newMaterial]}));
    };

    const removePackagingMaterial = (index: number) => {
        setFormData(prev => ({...prev, packagingMaterials: prev.packagingMaterials?.filter((_, i) => i !== index) }));
    };


    const handleSubmit = async () => {
        setIsSaving(true)
        try {
            const newData: ProductionData = {
                ...formData,
                id: logId || formData.id || Date.now().toString(),
            };
            await addOrUpdate(COLLECTION_NAME, newData)
            toast({title: "Éxito", description: `Lote de producción ${newData.lot} guardado.`})
            router.push('/production/liquids');
        } catch (error) {
            toast({variant: "destructive", title: "Error", description: "No se pudo guardar el lote."})
        } finally {
            setIsSaving(false)
        }
    };
    
    return (
        <>
            <PageHeader title={isEditing ? "Editar Fabricación de Lote Líquido" : "Registrar Fabricación de Lote Líquido"}>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/production/liquids">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancelar
                        </Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar Fabricación"}
                    </Button>
                </div>
            </PageHeader>
            <div className="space-y-6 pb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información General del Lote</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="product">Producto</Label>
                            <Input id="product" value={formData.product || ''} onChange={(e) => handleInputChange('product', e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="item">Item</Label>
                            <Input id="item" value={formData.item || ''} onChange={(e) => handleInputChange('item', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lot">Lote</Label>
                            <Input id="lot" value={formData.lot || ''} onChange={(e) => handleInputChange('lot', e.target.value)} placeholder="Ingrese el número de lote"/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="carga">Carga</Label>
                            <Input id="carga" value={formData.carga || ''} onChange={(e) => handleInputChange('carga', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cliente">Cliente</Label>
                            <Input id="cliente" value={formData.cliente || ''} onChange={(e) => handleInputChange('cliente', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="orden">Orden</Label>
                            <Input id="orden" value={formData.orden || ''} onChange={(e) => handleInputChange('orden', e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label>Fecha</Label>
                            <Input value={formData.date || ''} readOnly className="bg-muted" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Responsable Fabricación</Label>
                            <Input value={formData.responsible?.name || ''} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>
                
                {(formData.stages || []).map((stage, stageIndex) => (
                    <Card key={stageIndex}>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <Input 
                                    value={stage.name || ''} 
                                    onChange={(e) => handleStageChange(stageIndex, 'name', e.target.value)} 
                                    placeholder="Nombre de la Etapa"
                                    className="text-lg font-semibold border-none shadow-none p-0 focus-visible:ring-0"
                                />
                                <Button variant="ghost" size="sm" onClick={() => removeStage(stageIndex)}>Quitar Etapa</Button>
                            </div>
                            <Textarea 
                                value={stage.attentionTo || ''}
                                onChange={(e) => handleStageChange(stageIndex, 'attentionTo', e.target.value)}
                                placeholder="Añadir instrucciones para esta etapa..."
                            />
                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1"><Label className="text-xs">Hora Inicio</Label><Input type="time" value={stage.startTime || ''} onChange={(e) => handleStageChange(stageIndex, 'startTime', e.target.value)} /></div>
                                <div className="space-y-1"><Label className="text-xs">Hora Fin</Label><Input type="time" value={stage.endTime || ''} onChange={(e) => handleStageChange(stageIndex, 'endTime', e.target.value)} /></div>
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
                                        <TableHead>Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {(stage.ingredients || []).map((ing, ingIndex) => (
                                        <TableRow key={ingIndex}>
                                            <TableCell data-label="Referencia"><Input value={ing.ref || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'ref', e.target.value)} /></TableCell>
                                            <TableCell data-label="Ingrediente"><Input value={ing.name || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'name', e.target.value)} /></TableCell>
                                            <TableCell data-label="Tarado"><Input type="number" value={ing.tare || 0} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'tare', parseFloat(e.target.value))} /></TableCell>
                                            <TableCell data-label="Cantidad"><Input type="number" value={ing.quantity || 0} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'quantity', parseFloat(e.target.value))} /></TableCell>
                                            <TableCell data-label="Lote"><Input value={ing.lot || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'lot', e.target.value)} /></TableCell>
                                            <TableCell data-label="Ajuste">
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant={ing.adjustment === '+' ? 'default' : 'outline'} onClick={() => handleIngredientChange(stageIndex, ingIndex, 'adjustment', '+')}><Plus className="h-4 w-4"/></Button>
                                                    <Button size="icon" variant={ing.adjustment === '-' ? 'destructive' : 'outline'} onClick={() => handleIngredientChange(stageIndex, ingIndex, 'adjustment', '-')}><Minus className="h-4 w-4"/></Button>
                                                </div>
                                            </TableCell>
                                            <TableCell data-label="Atención a"><Textarea value={ing.attentionTo || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'attentionTo', e.target.value)} /></TableCell>
                                            <TableCell data-label="Firma"><Input placeholder="Firma resp." value={ing.responsible?.name || ''} onChange={e => handleIngredientChange(stageIndex, ingIndex, 'responsible', { ...(ing.responsible || {}), name: e.target.value })} /></TableCell>
                                            <TableCell data-label="Acción"><Button variant="ghost" size="icon" onClick={() => removeIngredient(stageIndex, ingIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button variant="ghost" size="sm" onClick={() => addIngredient(stageIndex)} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingrediente a Etapa
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                 <Button variant="secondary" size="sm" onClick={addStage} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Etapa</Button>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"><CardTitle>Material de Empaque</CardTitle><Button size="sm" onClick={addPackagingMaterial}><PlusCircle className="mr-2 h-4 w-4" /> Añadir</Button></div>
                        </CardHeader>
                        <CardContent>
                            <Table className="responsive-table">
                                <TableHeader><TableRow><TableHead>Ref.</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead>Lote</TableHead><TableHead>Acción</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {formData.packagingMaterials?.map((mat, index) => (
                                        <TableRow key={index}>
                                            <TableCell data-label="Ref."><Input value={mat.ref || ''} onChange={e => handlePackagingChange(index, 'ref', e.target.value)} /></TableCell>
                                            <TableCell data-label="Producto"><Input value={mat.product || ''} onChange={e => handlePackagingChange(index, 'product', e.target.value)} /></TableCell>
                                            <TableCell data-label="Cantidad"><Input type="number" value={mat.quantity || 0} onChange={e => handlePackagingChange(index, 'quantity', parseFloat(e.target.value))} className="w-24" /></TableCell>
                                            <TableCell data-label="Lote"><Input value={mat.lot || ''} onChange={e => handlePackagingChange(index, 'lot', e.target.value)} /></TableCell>
                                            <TableCell data-label="Acción"><Button variant="destructive" size="icon" onClick={() => removePackagingMaterial(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader><CardTitle>Producto Final Teórico</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Cantidad (kg)</Label><Input type="number" value={formData.finalProductTheoretical || 0} onChange={e => handleInputChange('finalProductTheoretical', parseFloat(e.target.value))} /></div>
                                 <div className="space-y-2">
                                    <Label>Responsable Verificación</Label>
                                    <Input placeholder="Firma o Nombre" value={formData.responsibleVerification?.name || ''} onChange={(e) => handleInputChange('responsibleVerification.name', e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader><CardTitle>Firmas y Observaciones</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-center block">Quien Formula</Label><SignaturePad onSave={v => handleInputChange('signature', v)} initialSignature={formData.signature} /></div>
                            <div className="space-y-2"><Label className="text-center block">Quien Revisa</Label><SignaturePad onSave={v => handleInputChange('supervisorSignature', v)} initialSignature={formData.supervisorSignature} /></div>
                        </div>
                        <div className="grid gap-2"><Label>Observaciones</Label><Textarea value={formData.observations || ''} onChange={(e) => handleInputChange('observations', e.target.value)} /></div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
