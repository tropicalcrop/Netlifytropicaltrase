

'use client'

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, getAll, getById } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { PlusCircle, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { useCurrentUser } from "@/context/UserContext"
import { type Formulation } from "@/app/formulations/client-page"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import SignaturePad from "@/components/signature-pad"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ProductionData, type ProductionIngredient, type PackagingMaterial } from "../page"
import Link from 'next/link'
import { useRouter, useSearchParams } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { sendNotification } from "@/services/notificationService"

const COLLECTION_NAME = "production"

interface PowderProductionFormPageProps {
    logId?: string;
    isPrintView?: boolean;
}

export default function PowderProductionFormPage({ logId, isPrintView = false }: PowderProductionFormPageProps) {
    const currentUser = useCurrentUser()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [formData, setFormData] = useState<Partial<ProductionData>>({});
    const [ingredients, setIngredients] = useState<ProductionIngredient[]>([]);
    const [packagingMaterials, setPackagingMaterials] = useState<PackagingMaterial[]>([]);
    const [formulations, setFormulations] = useState<Formulation[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const isEditing = !!logId;
    const isPreview = searchParams.get('preview') === 'true' || isPrintView;
    const fromFormulations = searchParams.get('from') === 'formulations';
    const cloneFromId = searchParams.get('cloneFrom');

    useEffect(() => {
        const fetchDeps = async () => {
            const formulationsData = await getAll<Formulation>('formulations');
            setFormulations(formulationsData);
        };
        fetchDeps();
    }, []);

    useEffect(() => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];

        const initialData = {
            type: 'powder' as 'powder',
            date,
            status: "Pendiente",
            responsible: { name: currentUser?.name, id: currentUser?.id, role: currentUser?.role },
            signature: "",
            supervisorSignature: "",
            productionLeadSignature: "",
            finalProductTheoreticalPowder: 0,
            finalProductTheoreticalLiquid: 0,
            finalProductReal: 0,
            performance: 0,
            observations: ""
        };

        const loadFormData = async () => {
            if (isEditing) {
                const log = await getById<ProductionData>(COLLECTION_NAME, logId!);
                if (log) {
                    setFormData(log);
                    setIngredients(log.ingredients || []);
                    setPackagingMaterials(log.packagingMaterials || []);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "No se encontró el lote." });
                    router.push('/production/powders');
                }
            } else if (cloneFromId) {
                const logToClone = await getById<ProductionData>(COLLECTION_NAME, cloneFromId);
                if (logToClone) {
                    const { id, lot, date, startTime, endTime, signature, supervisorSignature, productionLeadSignature, ...restOfData } = logToClone;
                    setFormData({
                        ...restOfData,
                        ...initialData
                    });
                    setIngredients(restOfData.ingredients || []);
                    setPackagingMaterials(restOfData.packagingMaterials || []);
                } else {
                    setFormData(initialData);
                    setIngredients([]);
                    setPackagingMaterials([]);
                }
            } else {
                setFormData(initialData);
                setIngredients([]);
                setPackagingMaterials([]);
            }
        };

        loadFormData();

    }, [isEditing, logId, cloneFromId, currentUser, router, toast]);

    const handleInputChange = (field: keyof ProductionData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleIngredientChange = (index: number, field: keyof ProductionIngredient, value: any) => {
        const updatedIngredients = [...ingredients];
        (updatedIngredients[index] as any)[field] = value;
        setIngredients(updatedIngredients);
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { ref: '', name: '', quantity: 0, unit: 'kg', lot: '', check: null, adjustment: null, attentionTo: '' }]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };
    
    const handlePackagingChange = (index: number, field: keyof PackagingMaterial, value: any) => {
        const updatedMaterials = [...packagingMaterials];
        (updatedMaterials[index] as any)[field] = value;
        setPackagingMaterials(updatedMaterials);
    };

    const addPackagingMaterial = () => {
        setPackagingMaterials([...packagingMaterials, { product: '', lot: '', ref: '', unit: 'Und', quantity: 0 }]);
    };

    const removePackagingMaterial = (index: number) => {
        setPackagingMaterials(packagingMaterials.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const now = new Date();
            
            const theoreticalTotal = (formData.finalProductTheoreticalPowder || 0) + (formData.finalProductTheoreticalLiquid || 0);
            const finalPerformance = theoreticalTotal > 0 ? ((formData.finalProductReal || 0) / theoreticalTotal) * 100 : 0;

            const newData: ProductionData = {
                ...formData,
                id: logId || Date.now().toString(),
                ingredients: ingredients,
                packagingMaterials: packagingMaterials,
                performance: isNaN(finalPerformance) ? 0 : parseFloat(finalPerformance.toFixed(2)),
                endTime: formData.endTime || now.toTimeString().split(' ')[0].slice(0,5),
            };
            const savedData = await addOrUpdate(COLLECTION_NAME, newData);

            if (!isEditing && currentUser) {
                await sendNotification({
                    title: 'Nuevo Lote Registrado',
                    message: `Se ha creado el lote de polvos ${savedData.lot} para el producto ${savedData.product}.`,
                    senderId: currentUser.id as string,
                    senderName: currentUser.name,
                    recipient: 'all', // Notify everyone
                    link: `/production/${savedData.item}`
                });
            }

            toast({ title: "Éxito", description: `Lote de producción ${newData.lot} guardado.` });
            router.push(fromFormulations ? `/formulations` : `/production/${savedData.item}`);
        } catch(e) {
             toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro de fabricación." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const backLink = fromFormulations ? '/formulations' : (formData.item ? `/production/${formData.item}` : '/production/powders');

    const Wrapper = isPrintView ? 'div' : PageHeader;
    const FormWrapper = isPrintView ? 'div' : ScrollArea;
    const formWrapperProps = isPrintView ? {} : { className: "h-[calc(100vh-200px)]" };

    return (
        <>
        <Wrapper title={isEditing ? 'Editar Fabricación de Lote' : 'Registrar Fabricación de Lote'}>
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
                        {isSaving ? 'Guardando...' : 'Guardar Fabricación'}
                    </Button>
                </div>
            )}
        </Wrapper>
        <FormWrapper {...formWrapperProps}>
            <div className="space-y-6 p-1 pb-6">
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        
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
                            <Label htmlFor="date">Fecha</Label>
                            <Input id="date" type="date" value={formData.date || ''} readOnly className="bg-muted" disabled={isPreview}/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="startTime">Hora Inicio</Label>
                            <Input id="startTime" type="time" value={formData.startTime || ''} onChange={e => handleInputChange('startTime', e.target.value)} disabled={isPreview} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endTime">Hora Fin</Label>
                            <Input id="endTime" type="time" value={formData.endTime || ''} onChange={e => handleInputChange('endTime', e.target.value)} disabled={isPreview} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Ingredientes</CardTitle>
                                <CardDescription>Detalle de los componentes de la formulación.</CardDescription>
                            </div>
                            {!isPreview && <Button size="sm" onClick={addIngredient} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingrediente</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="responsive-table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ref.</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Lote</TableHead>
                                    <TableHead>Chequeo</TableHead>
                                    <TableHead>Atención a</TableHead>
                                    {!isPreview && <TableHead>Acción</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ingredients.map((ing, index) => (
                                    <TableRow key={index}>
                                        <TableCell data-label="Ref."><Input value={ing.ref || ''} onChange={e => handleIngredientChange(index, 'ref', e.target.value)} className="w-24" disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Producto"><Input value={ing.name || ''} onChange={e => handleIngredientChange(index, 'name', e.target.value)} disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Cantidad" className="flex items-center gap-1">
                                            <Input type="number" value={ing.quantity || 0} onChange={e => handleIngredientChange(index, 'quantity', parseFloat(e.target.value))} className="w-20" disabled={isPreview}/>
                                                <Select value={ing.unit || 'kg'} onValueChange={v => handleIngredientChange(index, 'unit', v)} disabled={isPreview}>
                                                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="kg">kg</SelectItem>
                                                    <SelectItem value="g">g</SelectItem>
                                                    <SelectItem value="Lt">Lt</SelectItem>
                                                    <SelectItem value="ml">ml</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell data-label="Lote"><Input value={ing.lot || ''} onChange={e => handleIngredientChange(index, 'lot', e.target.value)} className="w-32" disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Chequeo">
                                            <div className="flex gap-1">
                                                <Button size="sm" variant={ing.check === 'C' ? 'default': 'outline'} onClick={() => !isPreview && handleIngredientChange(index, 'check', 'C')} disabled={isPreview}>C</Button>
                                                <Button size="sm" variant={ing.check === 'NC' ? 'destructive': 'outline'} onClick={() => !isPreview && handleIngredientChange(index, 'check', 'NC')} disabled={isPreview}>NC</Button>
                                            </div>
                                        </TableCell>
                                        <TableCell data-label="Atención a"><Textarea value={ing.attentionTo || ''} onChange={e => handleIngredientChange(index, 'attentionTo', e.target.value)} disabled={isPreview}/></TableCell>
                                        {!isPreview && <TableCell data-label="Acción"><Button variant="destructive" size="icon" onClick={() => removeIngredient(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="rounded-xl">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <CardTitle>Material de Empaque</CardTitle>
                            </div>
                            {!isPreview && <Button size="sm" onClick={addPackagingMaterial} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Material</Button>}
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table className="responsive-table">
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Ref.</TableHead>
                                    <TableHead>Producto</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead>Lote</TableHead>
                                    {!isPreview && <TableHead>Acción</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packagingMaterials.map((mat, index) => (
                                    <TableRow key={index}>
                                        <TableCell data-label="Ref."><Input value={mat.ref || ''} onChange={e => handlePackagingChange(index, 'ref', e.target.value)} disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Producto"><Input value={mat.product || ''} onChange={e => handlePackagingChange(index, 'product', e.target.value)} disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Cantidad"><Input type="number" value={mat.quantity || 0} onChange={e => handlePackagingChange(index, 'quantity', parseFloat(e.target.value))} disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Unidad"><Input value={mat.unit || ''} onChange={e => handlePackagingChange(index, 'unit', e.target.value)} placeholder="Und, Kg..." disabled={isPreview}/></TableCell>
                                        <TableCell data-label="Lote"><Input value={mat.lot || ''} onChange={e => handlePackagingChange(index, 'lot', e.target.value)} disabled={isPreview}/></TableCell>
                                        {!isPreview && <TableCell data-label="Acción"><Button variant="destructive" size="icon" onClick={() => removePackagingMaterial(index)}><Trash2 className="h-4 w-4" /></Button></TableCell>}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <Card className="rounded-xl">
                    <CardHeader><CardTitle>Producto Final</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="grid gap-2">
                            <Label>Producto Final Teórico (Polvos)</Label>
                            <Input type="number" value={formData.finalProductTheoreticalPowder || ''} onChange={e => handleInputChange('finalProductTheoreticalPowder', parseFloat(e.target.value) || 0)} disabled={isPreview}/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Producto Final Teórico (Líquidos)</Label>
                            <Input type="number" value={formData.finalProductTheoreticalLiquid || ''} onChange={e => handleInputChange('finalProductTheoreticalLiquid', parseFloat(e.target.value) || 0)} disabled={isPreview}/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Producto Final Real (Kg)</Label>
                            <Input type="number" value={formData.finalProductReal || ''} onChange={e => handleInputChange('finalProductReal', parseFloat(e.target.value) || 0)} disabled={isPreview}/>
                        </div>
                        <div className="grid gap-2">
                            <Label>Rendimiento (%)</Label>
                            <Input value={(((formData.finalProductReal || 0) / ((formData.finalProductTheoreticalPowder || 0) + (formData.finalProductTheoreticalLiquid || 0))) * 100 || 0).toFixed(2)} readOnly disabled={isPreview}/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl">
                    <CardHeader><CardTitle>Firmas y Observaciones</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-center block">Quien Formula</Label>
                                <SignaturePad onSave={v => handleInputChange('signature', v)} initialSignature={formData.signature} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-center block">Quien Revisa</Label>
                                <SignaturePad onSave={v => handleInputChange('supervisorSignature', v)} initialSignature={formData.supervisorSignature} disabled={isPreview}/>
                            </div>
                                <div className="space-y-2">
                                <Label className="text-center block">VoBo Jefe de Producción</Label>
                                <SignaturePad onSave={v => handleInputChange('productionLeadSignature', v)} initialSignature={formData.productionLeadSignature} disabled={isPreview}/>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Observaciones</Label>
                            <Textarea value={formData.observations || ''} onChange={e => handleInputChange('observations', e.target.value)} disabled={isPreview}/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FormWrapper>
        </>
    )
}
