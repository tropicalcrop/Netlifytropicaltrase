

'use client'

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { addOrUpdate, remove, getAll, getById, uploadFile } from "@/services/firestoreService"
import { PageHeader } from "@/components/page-header"
import { ArrowLeft, Loader2, Minus, Plus, Trash2, Info, Upload, Camera, AlertTriangle, ListOrdered } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { type UserData } from "@/app/users/page"
import { useCurrentUser } from "@/context/UserContext"
import SignaturePad from "@/components/signature-pad"
import { type ProductionData } from '@/app/production/page'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type QualityData, type QualityFormType, initialLuminometryItemsPowders, initialLuminometryItemsLiquids, type LuminometryItem, initialScalesLiquidsData, initialScalesPowdersData, initialMagnetInspectionData, initialAttributeReleaseData, initialInProcessLiquidsData, InProcessTableRow, AttributeCheck, type HygienicInspection, type EquipmentVerification, initialAreaClearanceLiquidsData, initialAreaClearancePowdersData, type EquipmentDetails, type EndowmentItem, AreaInspectionItem } from './types'
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import Link from 'next/link'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { type HygieneData } from "../hygiene/page"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface QualityFormPageProps {
    logId?: string;
    formType: QualityFormType;
    isPrintView?: boolean;
}

const getPageDetails = (formType: QualityFormType) => {
    const details: {title: string, collectionName: string, luminometryType?: 'powders'|'liquids'} = {
        'luminometry': { title: "Luminometría (Polvos)", collectionName: 'quality_luminometry', luminometryType: 'powders' },
        'luminometry-liquids': { title: "Luminometría (Líquidos)", collectionName: 'quality_luminometry_liquids', luminometryType: 'liquids' },
        'sensory': { title: "Análisis Sensorial", collectionName: 'quality_sensory' },
        'in-process': { title: "Control en Proceso", collectionName: 'quality_in_process' },
        'in-process-liquids': { title: "Control en Proceso para Líquidos", collectionName: 'quality_in_process_liquids' },
        'finished-product': { title: "Envasado y Empaque", collectionName: 'quality_finished_product' },
        'final-bulk-inspection': { title: "Inspección del Bulto Final", collectionName: 'quality_final_bulk_inspection' },
        'endowment': { title: "Control de Dotación del Personal", collectionName: 'endowment' },
        'pcc': { title: "Inspección de Puntos Críticos de Control (PCC)", collectionName: 'pcc' },
        'pcc_liquids': { title: "Inspección PCC (Inicio Fabricación)", collectionName: 'pcc_liquids' },
        'pcc-final-inspection': { title: "Inspección PCC (Final)", collectionName: 'quality_pcc_final_inspection' },
        'scales': { title: "Verificación de Básculas (Polvos)", collectionName: 'scales' },
        'scales-liquids': { title: "Verificación de Básculas (Líquidos)", collectionName: 'scales-liquids' },
        'utensils': { title: "Control de Utensilios", collectionName: 'utensils' },
        'utensils-liquids': { title: "Inspección de Utensilios y Artículos", collectionName: 'utensils_liquids' },
        'magnet-inspection': { title: "Inspección de Imán", collectionName: 'quality_magnet_inspection' },
        'attribute-release': { title: "Liberación por Atributos", collectionName: 'quality_attribute_release' },
        'weighing': { title: "Control de Pesaje", collectionName: 'weighing' },
        'temp-humidity': { title: "Temperatura y Humedad", collectionName: 'quality_temp_humidity' },
        'area-clearance-powders': { title: 'Despeje de Área para Polvos', collectionName: 'quality_area_clearance_powders' },
        'area-clearance-liquids': { title: 'Despeje de Área para Líquidos', collectionName: 'quality_area_clearance_liquids' },
        'hygiene': { title: "Higiene y Saneamiento (Polvos)", collectionName: 'hygiene' },
        'hygiene_liquids': { title: "Higiene y Saneamiento (Líquidos)", collectionName: 'hygiene_liquids' },
    };
    
    return details[formType] || details['luminometry'];
};


export default function QualityFormPage({ formType, logId, isPrintView = false }: QualityFormPageProps) {
    const currentUser = useCurrentUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<QualityData>>({});
    const [productionData, setProductionData] = useState<ProductionData[]>([]);
    const [usersData, setUsersData] = useState<UserData[]>([]);
    const [activeHygieneLog, setActiveHygieneLog] = useState<HygieneData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    const isEditing = !!logId;
    const isPreview = searchParams.get('preview') === 'true' || isPrintView;

    const { title, collectionName, luminometryType } = getPageDetails(formType);
    
    const backLink = useMemo(() => {
        if (formType.startsWith('scales')) return '/quality/scales';
        if (formType.startsWith('luminometry')) return '/quality/luminometry';
        if (formType.startsWith('area-clearance')) return '/quality/area-clearance';
        if (formType.startsWith('hygiene')) return '/quality/hygiene';
        if (['endowment', 'pcc', 'utensils', 'utensils-liquids', 'magnet-inspection', 'pcc-final-inspection', 'pcc_liquids'].includes(formType)) return '/pcc';
        
        return '/quality';
    }, [formType]);

    useEffect(() => {
        const fetchDeps = async () => {
            const isLiquidsFlow = formType.includes('liquids');
            const hygieneCollection = isLiquidsFlow ? 'hygiene_liquids' : 'hygiene';

            const logs = await getAll<HygieneData>(hygieneCollection);
            const activeLogs = logs
                .filter(log => (log as any).cycleId === null || (log as any).cycleId === undefined)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            if (activeLogs.length > 0) {
                setActiveHygieneLog(activeLogs[0]);
            }
            
            // Fetch production data for all forms to show the queue
            const prodLogs = await getAll<ProductionData>('production');
            setProductionData(prodLogs);
            
            if (formType === 'endowment') {
                const users = await getAll<UserData>('users');
                setUsersData(users);
            }
        };
        fetchDeps();
    }, [formType]);

    useEffect(() => {
        if (isEditing) {
            getById<QualityData>(collectionName, logId).then(log => {
                if(log) {
                    setFormData(log);
                    if (log.photoUrl) setPhotoPreview(log.photoUrl);
                    if (log.rawMaterialMonitoring?.photoUrl) setPhotoPreview(log.rawMaterialMonitoring.photoUrl);
                    if (log.hygieneLogId) {
                        const hygieneCollection = formType.includes('liquids') ? 'hygiene_liquids' : 'hygiene';
                        getById<HygieneData>(hygieneCollection, log.hygieneLogId).then(setActiveHygieneLog);
                    }
                } else {
                    toast({ variant: "destructive", title: "Error", description: "No se encontró el registro." });
                    router.back();
                }
            });
        } else {
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            
            let initialData: Partial<QualityData> = {
                date,
                responsible: { name: currentUser?.name, id: currentUser?.id, role: currentUser?.role },
                signature: "",
                status: 'Pendiente', // Default status
            };
             if (activeHygieneLog) {
                initialData.hygieneLogId = activeHygieneLog.id;
                initialData.product = activeHygieneLog.product;
                initialData.lot = activeHygieneLog.lot;
                initialData.item = activeHygieneLog.item;
                initialData.client = activeHygieneLog.client;
                initialData.order = activeHygieneLog.order;
            }
             if (formType === 'endowment') {
                initialData.endowmentItems = [
                    { name: 'Dotación completa (uniforme, cofias, botas, guantes, tapabocas), BPM', status: 'Conforme' },
                    { name: 'Elementos de protección individual (monogafas, tapaoídos, guantes, tapabocas, tapaoídos de copa, protección respiratoria)', status: 'Conforme' }
                ];
                initialData.reviewedBy = currentUser?.name;
            }
             if (formType === 'pcc') {
                initialData.tamizId = { letters: '', zone: '', mesh: '', letter: '' };
                initialData.zarandaId = { letters: '', zone: '', number: '' };
            }
            if (formType === 'pcc_liquids') {
                initialData.filterId = { letters: '', zone: '', mesh: '', letter: '', lid: '' };
                initialData.filterMeshState = 'SI';
                initialData.foreignParticlesBefore = 'NO';
            }
             if (formType === 'luminometry') {
                const items = initialLuminometryItemsPowders;
                initialData.luminometryItems = items.map(item => ({
                    ...item,
                    reviewedBy: currentUser?.name || ''
                }));
            }
            if (formType === 'luminometry-liquids') {
                const items = initialLuminometryItemsLiquids;
                initialData.luminometryItems = items.map(item => ({
                    ...item,
                    reviewedBy: currentUser?.name || ''
                }));
            }
            if (formType === 'scales-liquids') {
                 initialData = { ...initialData, equipmentDetails: [], testRows: [] };
            }
             if (formType === 'scales') {
                 initialData = { ...initialData, equipmentDetails: [], testRows: [] };
            }
             if (formType === 'finished-product') {
                const time = now.toTimeString().split(' ')[0].slice(0, 5);
                initialData.packagingStartTime = time;
                initialData.packagingRegisteredBy = currentUser?.name || '';
                initialData.packagingSeries = [{ initial: '', final: '' }];
            }
             if (formType === 'final-bulk-inspection') {
                initialData.finalPackageInspection_freeOfForeignMaterial = 'SI';
                initialData.finalPackageInspection_registeredBy = currentUser?.name || '';
            }
            if (formType === 'magnet-inspection') {
                initialData = { ...initialData, ...initialMagnetInspectionData };
            }
             if (formType === 'attribute-release') {
                initialData = { ...initialData, ...initialAttributeReleaseData, releaseDate: date, releasedBy: currentUser?.name };
            }
             if (formType === 'in-process-liquids') {
                initialData = { ...initialData, ...initialInProcessLiquidsData, responsible: { name: currentUser?.name, id: currentUser?.id } };
            }
             if (formType === 'in-process') {
                initialData.inProcessStatus = 'Conforme';
            }
            if (formType === 'weighing') {
                initialData.weighingTime = "";
            }
            if (formType === 'temp-humidity') {
                initialData.tempHumidityReviewedBy = currentUser?.name || '';
            }
            if (formType === 'area-clearance-powders') {
                initialData = { ...initialData, ...initialAreaClearancePowdersData };
            }
            if (formType === 'area-clearance-liquids') {
                initialData = { ...initialData, ...initialAreaClearanceLiquidsData };
            }
            if (formType === 'pcc-final-inspection') {
                initialData.status = 'Conforme';
                initialData.retainedIsFromProduct = 'NO';
                initialData.tamizInGoodState = 'SI';
            }
            if (formType === 'final-bulk-inspection') {
                initialData.freeOfForeignMaterial = 'SI';
            }
            if(formType === 'utensils-liquids') {
                initialData.checklistCompleted = 'SI';
                initialData.reviewedBy = currentUser?.name;
            }
            setFormData(initialData);
        }
    }, [isEditing, logId, formType, collectionName, currentUser, router, toast, activeHygieneLog]);

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

    const handleInputChange = (field: keyof QualityData | `hygienicInspection.${keyof HygienicInspection}` | `equipmentVerification.${keyof EquipmentVerification}` | `tamizId.${string}` | `zarandaId.${string}` | `filterId.${string}` | `attributeRelease.${keyof AttributeCheck}` | `rawMaterialMonitoring.${string}`, value: any) => {
        if (field.startsWith('hygienicInspection.')) {
            const itemKey = field.split('.')[1] as keyof HygienicInspection;
            setFormData(prev => ({ ...prev, hygienicInspection: { ...prev.hygienicInspection, [itemKey]: value } }));
            return;
        }
        if (field.startsWith('equipmentVerification.')) {
            const itemKey = field.split('.')[1] as keyof EquipmentVerification;
            setFormData(prev => ({ ...prev, equipmentVerification: { ...prev.equipmentVerification, [itemKey]: value } }));
            return;
        }
        if (field.startsWith('tamizId.')) {
            const itemKey = field.split('.')[1];
            setFormData(prev => ({ ...prev, tamizId: { ...prev.tamizId, [itemKey]: value } as any }));
            return;
        }
        if (field.startsWith('zarandaId.')) {
            const itemKey = field.split('.')[1];
            setFormData(prev => ({ ...prev, zarandaId: { ...prev.zarandaId, [itemKey]: value } as any }));
            return;
        }
         if (field.startsWith('filterId.')) {
            const itemKey = field.split('.')[1];
            setFormData(prev => ({ ...prev, filterId: { ...prev.filterId, [itemKey]: value } as any }));
            return;
        }
        if (field.startsWith('attributeRelease.')) {
            const [, category, key] = field.split('.');
            setFormData(prev => ({
                ...prev,
                attributeRelease: {
                    ...prev.attributeRelease,
                    [category]: {
                        ...prev.attributeRelease?.[category as keyof typeof formData.attributeRelease],
                        [key]: value
                    }
                }
            }));
            return;
        }
        if (field.startsWith('rawMaterialMonitoring.')) {
            const itemKey = field.split('.')[1];
            setFormData(prev => ({ ...prev, rawMaterialMonitoring: { ...prev.rawMaterialMonitoring, [itemKey]: value } as any }));
            return;
        }


        let updatedFormData = { ...formData, [field]: value };
        setFormData(updatedFormData);
    };

    const handleAreaInspectionItemChange = (section: 'hygienicInspection' | 'equipmentVerification', index: number, field: keyof AreaInspectionItem, value: any) => {
        const items = formData[section] as AreaInspectionItem[] || [];
        const updatedItems = [...items];
        (updatedItems[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, [section]: updatedItems }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
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
              setPhotoFile(file);
              setPhotoPreview(URL.createObjectURL(file));
              setIsCameraOpen(false);
            }
          }, 'image/jpeg');
        }
    };

    const handleTestRowChange = (equipmentIndex: number, testRowIndex: number, colKey: string, value: any, subIndex?: number) => {
        const updatedEquipmentDetails = [...(formData.equipmentDetails || [])];
        const equipment = updatedEquipmentDetails[equipmentIndex];
        if (!equipment || !equipment.testRows) return;
        const newTestRows = [...equipment.testRows];
        
        if (colKey === 'repeatability' || colKey === 'eccentricity') {
            (newTestRows[testRowIndex][colKey] as (number | null)[])[subIndex!] = value ? parseFloat(value) : null;
        } else if (colKey === 'usage') {
            (newTestRows[testRowIndex][colKey] as any)[subIndex!.toString()] = value;
        } else {
            (newTestRows[testRowIndex] as any)[colKey] = value;
        }
        
        equipment.testRows = newTestRows;
        setFormData(prev => ({ ...prev, equipmentDetails: updatedEquipmentDetails }));
    }
    
    const handleEquipmentDetailChange = (index: number, field: keyof EquipmentDetails, value: any) => {
        const updatedEquipmentDetails = [...(formData.equipmentDetails || [])];
        (updatedEquipmentDetails[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, equipmentDetails: updatedEquipmentDetails }));
    };
    
    const addEquipment = () => {
        const newEquipment: EquipmentDetails = {
            equipment: '',
            seriesModel: '',
            fixedPointError: 0,
            platePointError: 0,
            testRows: []
        };
        setFormData(prev => ({ ...prev, equipmentDetails: [...(prev.equipmentDetails || []), newEquipment] }));
    };

    const removeEquipment = (index: number) => {
        const updatedEquipmentDetails = (formData.equipmentDetails || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, equipmentDetails: updatedEquipmentDetails }));
    };
    
    const addTestRow = (equipmentIndex: number) => {
        const newTestRow = {
            standardWeight: '',
            repeatability: [null, null, null, null],
            eccentricity: [null, null, null, null, null],
            usage: {
                mp: false,
                pt: false,
                v: false
            },
            compliance: ''
        };
        const updatedEquipmentDetails = [...(formData.equipmentDetails || [])];
        updatedEquipmentDetails[equipmentIndex].testRows = [...(updatedEquipmentDetails[equipmentIndex].testRows || []), newTestRow];
        setFormData(prev => ({...prev, equipmentDetails: updatedEquipmentDetails}));
    };

    const removeTestRow = (equipmentIndex: number, testRowIndex: number) => {
        const updatedEquipmentDetails = [...(formData.equipmentDetails || [])];
        const testRows = updatedEquipmentDetails[equipmentIndex].testRows || [];
        updatedEquipmentDetails[equipmentIndex].testRows = testRows.filter((_, i) => i !== testRowIndex);
        setFormData(prev => ({...prev, equipmentDetails: updatedEquipmentDetails}));
    };


     const handleLuminometryItemChange = (index: number, field: keyof LuminometryItem, value: any) => {
        const updatedItems = [...(formData.luminometryItems || [])];
        const item = { ...updatedItems[index], [field]: value };

        if (field === 'result') {
            const numValue = Number(value);
            item.compliance = numValue <= 30 ? 'SI' : 'NO';
        }

        updatedItems[index] = item;
        setFormData(prev => ({ ...prev, luminometryItems: updatedItems }));
    };

    const handleEndowmentItemChange = (index: number, value: 'Conforme' | 'No Conforme') => {
        const updatedItems = [...(formData.endowmentItems || [])];
        updatedItems[index] = { ...updatedItems[index], status: value };
        setFormData(prev => ({ ...prev, endowmentItems: updatedItems }));
    };

    const handlePackagingSeriesChange = (index: number, field: 'initial' | 'final', value: string) => {
        const updatedSeries = [...(formData.packagingSeries || [])];
        updatedSeries[index][field] = value;
        setFormData(prev => ({ ...prev, packagingSeries: updatedSeries }));
    }

    const addPackagingSeriesRow = () => {
        const series = formData.packagingSeries || [];
        setFormData(prev => ({ ...prev, packagingSeries: [...series, { initial: '', final: '' }] }));
    }

    const removePackagingSeriesRow = (index: number) => {
        const series = (formData.packagingSeries || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, packagingSeries: series }));
    }

    const handleFindingChange = (index: number, field: 'finding' | 'correctiveAction' | 'responsible' | 'date', value: string) => {
        const updatedFindings = [...(formData.findings || [])];
        (updatedFindings[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, findings: updatedFindings }));
    };

    const addFinding = () => {
        const newFinding = { id: Date.now().toString(), finding: '', correctiveAction: '', responsible: currentUser?.name || '', date: new Date().toISOString().split('T')[0] };
        setFormData(prev => ({ ...prev, findings: [...(prev.findings || []), newFinding] }));
    };

    const removeFinding = (index: number) => {
        const updatedFindings = (formData.findings || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, findings: updatedFindings }));
    };
    
    const handleSignatureChange = (index: number, signature: string) => {
        const updatedSignatures = [...(formData.signatures || [])];
        updatedSignatures[index].signature = signature;
        updatedSignatures[index].date = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, signatures: updatedSignatures }));
    };

    const handleInProcessTableChange = (index: number, field: keyof InProcessTableRow, value: any) => {
        const updatedTable = [...(formData.inProcessTable || [])];
        (updatedTable[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, inProcessTable: updatedTable }));
    };
    
    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const newData: Partial<QualityData> = {
                ...formData,
                id: logId || Date.now().toString(),
            };

            if (photoFile) {
                const filePath = `quality-photos/${collectionName}/${newData.id}-${photoFile.name}`;
                const photoUrl = await uploadFile(photoFile, filePath);
                if (formType === 'in-process-liquids') {
                    newData.rawMaterialMonitoring = { ...newData.rawMaterialMonitoring, photoUrl };
                } else {
                    newData.photoUrl = photoUrl;
                }
            }

            await addOrUpdate(collectionName, newData as QualityData);
            toast({ title: "Éxito", description: `Registro de calidad guardado.` });
            router.push(backLink);
        } catch(e) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar el registro." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderScalesTable = () => {
        return (
            <div className="space-y-4">
                {(formData.equipmentDetails || []).map((equipment, equipmentIndex) => (
                    <Card key={equipmentIndex} className="rounded-xl">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Equipo #{equipmentIndex + 1}</CardTitle>
                                {!isPreview && <Button variant="destructive" size="sm" onClick={() => removeEquipment(equipmentIndex)}><Trash2 className="h-4 w-4 mr-2"/> Quitar Equipo</Button>}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label>Equipo</Label><Input value={equipment.equipment} onChange={e => handleEquipmentDetailChange(equipmentIndex, 'equipment', e.target.value)} disabled={isPreview} /></div>
                                <div className="space-y-1"><Label>Serie y Modelo</Label><Input value={equipment.seriesModel} onChange={e => handleEquipmentDetailChange(equipmentIndex, 'seriesModel', e.target.value)} disabled={isPreview} /></div>
                                <div className="space-y-1"><Label>Error en punto fijo</Label><Input type="number" value={equipment.fixedPointError} onChange={e => handleEquipmentDetailChange(equipmentIndex, 'fixedPointError', parseFloat(e.target.value))} disabled={isPreview} /></div>
                                <div className="space-y-1"><Label>Error en puntos del plato (d)</Label><Input type="number" value={equipment.platePointError} onChange={e => handleEquipmentDetailChange(equipmentIndex, 'platePointError', parseFloat(e.target.value))} disabled={isPreview} /></div>
                            </div>
                            
                            {(equipment.testRows || []).map((row, testRowIndex) => (
                                <div key={testRowIndex} className="space-y-3 border p-4 rounded-md relative">
                                    {!isPreview && (
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeTestRow(equipmentIndex, testRowIndex)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    )}
                                     <div className="space-y-1">
                                        <Label>Masa Patrón</Label>
                                        <Input value={row.standardWeight} onChange={e => handleTestRowChange(equipmentIndex, testRowIndex, 'standardWeight', e.target.value)} placeholder="Ej: 10Kg" disabled={isPreview} />
                                    </div>
                                    <div className='space-y-2'>
                                        <Label className="font-semibold">Prueba de Repetibilidad (€)</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                            {[0,1,2,3].map(i => <Input key={`rep-${i}`} type="number" value={row.repeatability[i] ?? ''} onChange={e => handleTestRowChange(equipmentIndex, testRowIndex, 'repeatability', e.target.value, i)} disabled={isPreview}/>)}
                                        </div>
                                    </div>
                                    
                                    <div className='space-y-2'>
                                        <Label className="font-semibold">Prueba de Excentricidad (d)</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                                            {[0,1,2,3,4].map(i => <Input key={`exc-${i}`} type="number" value={row.eccentricity[i] ?? ''} onChange={e => handleTestRowChange(equipmentIndex, testRowIndex, 'eccentricity', e.target.value, i)} disabled={isPreview}/>)}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                        <div className="space-y-2">
                                            <Label className="font-semibold">*USO</Label>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2"><Checkbox checked={row.usage.mp} onCheckedChange={c => handleTestRowChange(equipmentIndex, testRowIndex, 'usage', !!c, 'mp')} disabled={isPreview}/> MP</div>
                                                <div className="flex items-center gap-2"><Checkbox checked={row.usage.pt} onCheckedChange={c => handleTestRowChange(equipmentIndex, testRowIndex, 'usage', !!c, 'pt')} disabled={isPreview}/> PT</div>
                                                <div className="flex items-center gap-2"><Checkbox checked={row.usage.v} onCheckedChange={c => handleTestRowChange(equipmentIndex, testRowIndex, 'usage', !!c, 'v')} disabled={isPreview}/> V</div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="font-semibold">Cumple/No Cumple</Label>
                                            <Select value={row.compliance} onValueChange={v => handleTestRowChange(equipmentIndex, testRowIndex, 'compliance', v)} disabled={isPreview}>
                                                <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
                                                <SelectContent><SelectItem value="Cumple">Cumple</SelectItem><SelectItem value="No Cumple">No Cumple</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!isPreview && <Button variant="outline" size="sm" className="mt-2" onClick={() => addTestRow(equipmentIndex)}><Plus className="h-4 w-4 mr-2"/>Añadir Prueba</Button>}
                        </CardContent>
                    </Card>
                ))}
                {!isPreview && <Button onClick={addEquipment}><Plus className="h-4 w-4 mr-2"/>Añadir Equipo</Button>}
            </div>
        )
    };

    const renderAttributeReleaseForm = () => {
        const categories = [
            { key: 'packaging', label: 'Envasado' },
            { key: 'packing', label: 'Embalaje' },
            { key: 'identification', label: 'Identificación' },
            { key: 'hermeticity', label: 'Hermeticidad' },
        ];

        return (
            <div className="space-y-6">
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>XIII. Liberación por Atributos</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Atributo</TableHead>
                                    {categories.map(cat => (
                                        <TableHead key={cat.key} className="text-center">{cat.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Cantidad de unidades revisadas</TableCell>
                                    {categories.map(cat => (
                                        <TableCell key={cat.key}>
                                            <Input type="number" className="w-24 mx-auto" value={formData.attributeRelease?.[cat.key as keyof typeof formData.attributeRelease]?.reviewedUnits || ''} onChange={e => handleInputChange(`attributeRelease.${cat.key}.reviewedUnits`, parseInt(e.target.value))} disabled={isPreview} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Consecutivo</TableCell>
                                    {categories.map(cat => (
                                        <TableCell key={cat.key}>
                                            <Input className="w-32 mx-auto" value={formData.attributeRelease?.[cat.key as keyof typeof formData.attributeRelease]?.consecutive || ''} onChange={e => handleInputChange(`attributeRelease.${cat.key}.consecutive`, e.target.value)} disabled={isPreview} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Hora</TableCell>
                                    {categories.map(cat => (
                                        <TableCell key={cat.key}>
                                            <Input type="time" className="w-32 mx-auto" value={formData.attributeRelease?.[cat.key as keyof typeof formData.attributeRelease]?.time || ''} onChange={e => handleInputChange(`attributeRelease.${cat.key}.time`, e.target.value)} disabled={isPreview} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Verificación de Pesos</TableCell>
                                    {categories.map(cat => (
                                        <TableCell key={cat.key}>
                                            <Input className="w-32 mx-auto" value={formData.attributeRelease?.[cat.key as keyof typeof formData.attributeRelease]?.weightVerification || ''} onChange={e => handleInputChange(`attributeRelease.${cat.key}.weightVerification`, e.target.value)} disabled={isPreview} />
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Cumple (C/NC)</TableCell>
                                    {categories.map(cat => (
                                        <TableCell key={cat.key}>
                                            <RadioGroup onValueChange={(v) => handleInputChange(`attributeRelease.${cat.key}.status`, v as any)} value={formData.attributeRelease?.[cat.key as keyof typeof formData.attributeRelease]?.status} className="flex justify-center" disabled={isPreview}>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="C" id={`${cat.key}-c`}/><Label htmlFor={`${cat.key}-c`}>C</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="NC" id={`${cat.key}-nc`}/><Label htmlFor={`${cat.key}-nc`}>NC</Label></div>
                                            </RadioGroup>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha de Liberación</Label>
                        <Input type="date" value={formData.releaseDate || ''} readOnly className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                        <Label>Liberado por</Label>
                        <Input value={formData.releasedBy || ''} onChange={e => handleInputChange('releasedBy', e.target.value)} disabled={isPreview} />
                    </div>
                </div>
            </div>
        );
    };

    const renderInProcessLiquidsForm = () => {
        return (
            <div className="space-y-6">
                <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>Información General</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Lote de Producción</Label>
                                 <Select onValueChange={(v) => {
                                      const selectedLog = productionData.find(l => l.lot === v);
                                      if (selectedLog) {
                                          setFormData(prev => ({
                                              ...prev,
                                              lot: selectedLog.lot,
                                              product: selectedLog.product,
                                              item: selectedLog.item
                                          }));
                                      }
                                 }} value={formData.lot} disabled={isPreview}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione un lote" /></SelectTrigger>
                                    <SelectContent>{productionData.filter(l => l.type === 'liquid' && l.lot).map(log => (<SelectItem key={log.id} value={log.lot!}>{log.lot} - {log.product}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label># Bidones Muestreados</Label>
                                <Input type="number" value={formData.drumsSampled || ''} onChange={e => handleInputChange('drumsSampled', Number(e.target.value))} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label>Lote de Referencia</Label>
                                <Input value={formData.referenceLot || ''} onChange={e => handleInputChange('referenceLot', e.target.value)} disabled={isPreview}/>
                            </div>
                         </div>
                         <div className="flex justify-between items-center pt-4">
                            <Label>Apariencia Producto VS Contramuestra</Label>
                            <RadioGroup value={formData.inProcessAppearance} onValueChange={(v) => handleInputChange('inProcessAppearance', v as any)} className="flex" disabled={isPreview}>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="Cumple" id="ap-c"/><Label htmlFor="ap-c">Cumple</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="No Cumple" id="ap-nc"/><Label htmlFor="ap-nc">No Cumple</Label></div>
                            </RadioGroup>
                         </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 rounded-xl">
                        <CardHeader><CardTitle>Control en Proceso</CardTitle></CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Parámetro</TableHead>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Temp</TableHead>
                                        <TableHead>Densidad</TableHead>
                                        <TableHead>Brix</TableHead>
                                        <TableHead>Color</TableHead>
                                        <TableHead>pH</TableHead>
                                        <TableHead>pH diluido</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.inProcessTable?.map((row, index) => (
                                        <TableRow key={row.parameter}>
                                            <TableCell className="font-semibold">{row.parameter}</TableCell>
                                            <TableCell><Input type="time" value={row.hour || ''} onChange={e => handleInProcessTableChange(index, 'hour', e.target.value)} disabled={isPreview} className="w-24"/></TableCell>
                                            <TableCell><Input type="number" value={row.temperature || ''} onChange={e => handleInProcessTableChange(index, 'temperature', Number(e.target.value))} disabled={isPreview} className="w-20"/></TableCell>
                                            <TableCell><Input type="number" value={row.density || ''} onChange={e => handleInProcessTableChange(index, 'density', Number(e.target.value))} disabled={isPreview} className="w-20"/></TableCell>
                                            <TableCell><Input type="number" value={row.brix || ''} onChange={e => handleInProcessTableChange(index, 'brix', Number(e.target.value))} disabled={isPreview} className="w-20"/></TableCell>
                                            <TableCell><Input value={row.color || ''} onChange={e => handleInProcessTableChange(index, 'color', e.target.value)} disabled={isPreview} className="w-24"/></TableCell>
                                            <TableCell><Input type="number" value={row.ph || ''} onChange={e => handleInProcessTableChange(index, 'ph', Number(e.target.value))} disabled={isPreview} className="w-20"/></TableCell>
                                            <TableCell><Input type="number" value={row.phDiluted || ''} onChange={e => handleInProcessTableChange(index, 'phDiluted', Number(e.target.value))} disabled={isPreview} className="w-20"/></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>Monitoreo Materia Prima</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                             <div className="space-y-1"><Label>Item Nombre</Label><Input value={formData.rawMaterialMonitoring?.itemName || ''} onChange={e => handleInputChange('rawMaterialMonitoring.itemName', e.target.value)} disabled={isPreview} /></div>
                             <div className="space-y-1"><Label>Lote</Label><Input value={formData.rawMaterialMonitoring?.lot || ''} onChange={e => handleInputChange('rawMaterialMonitoring.lot', e.target.value)} disabled={isPreview} /></div>
                             <div className="space-y-1"><Label>Densidad</Label><Input type="number" value={formData.rawMaterialMonitoring?.density || ''} onChange={e => handleInputChange('rawMaterialMonitoring.density', Number(e.target.value))} disabled={isPreview} /></div>
                             <div className="space-y-1"><Label>BRIX</Label><Input type="number" value={formData.rawMaterialMonitoring?.brix || ''} onChange={e => handleInputChange('rawMaterialMonitoring.brix', Number(e.target.value))} disabled={isPreview} /></div>
                             <div className="space-y-1"><Label>Temperatura</Label><Input type="number" value={formData.rawMaterialMonitoring?.temperature || ''} onChange={e => handleInputChange('rawMaterialMonitoring.temperature', Number(e.target.value))} disabled={isPreview} /></div>
                             <div className="space-y-1"><Label>Ph</Label><Input type="number" value={formData.rawMaterialMonitoring?.ph || ''} onChange={e => handleInputChange('rawMaterialMonitoring.ph', Number(e.target.value))} disabled={isPreview} /></div>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>Evidencia Fotográfica</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-4">
                            <Label className="font-semibold">Foto</Label>
                            <div className="flex items-center gap-4">
                                <Button asChild variant="outline" size="sm">
                                    <label htmlFor="photo-upload" className="cursor-pointer">
                                        <Upload className="mr-2 h-4 w-4"/>
                                        <span>{photoFile ? 'Cambiar foto' : 'Subir foto'}</span>
                                    </label>
                                </Button>
                                <Input id="photo-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" disabled={isPreview} />
                                <Button variant="outline" size="sm" onClick={() => setIsCameraOpen(true)} disabled={isPreview}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Tomar Foto
                                </Button>
                                {photoPreview && (
                                    <div className="relative w-24 h-24 border rounded-md">
                                        <Image src={photoPreview} alt="Vista previa" layout="fill" objectFit="cover" className="rounded-md" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderAreaClearanceForm = () => {
        const isLiquids = formType === 'area-clearance-liquids';
        
        if (!isLiquids) { // Powders form
            return (
                <div className='space-y-6'>
                    <div className="space-y-2">
                        <Label htmlFor="zoneCode">Código Zona</Label>
                        <Input id="zoneCode" value={formData.zoneCode || ''} onChange={e => handleInputChange('zoneCode', e.target.value)} disabled={isPreview} className="w-48"/>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader><CardTitle>Inspección Higiénica del Área</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Cumple (SI/NO)</TableHead><TableHead>Revisado Por</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {(formData.hygienicInspection as AreaInspectionItem[])?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>
                                                    <RadioGroup value={item.status} onValueChange={(v) => handleAreaInspectionItemChange('hygienicInspection', index, 'status', v as any)} className="flex" disabled={isPreview}>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id={`h-si-${index}`}/><Label htmlFor={`h-si-${index}`}>SI</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id={`h-no-${index}`}/><Label htmlFor={`h-no-${index}`}>NO</Label></div>
                                                    </RadioGroup>
                                                </TableCell>
                                                <TableCell><Input value={item.reviewedBy} onChange={(e) => handleAreaInspectionItemChange('hygienicInspection', index, 'reviewedBy', e.target.value)} disabled={isPreview}/></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Funcionamiento de Equipos y Verificación de Material Extraño</CardTitle></CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Conforme (SI/NO)</TableHead><TableHead>Revisado Por</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                         {(formData.equipmentVerification as AreaInspectionItem[])?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell>
                                                    <RadioGroup value={item.status} onValueChange={(v) => handleAreaInspectionItemChange('equipmentVerification', index, 'status', v as any)} className="flex" disabled={isPreview}>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id={`e-si-${index}`}/><Label htmlFor={`e-si-${index}`}>SI</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id={`e-no-${index}`}/><Label htmlFor={`e-no-${index}`}>NO</Label></div>
                                                    </RadioGroup>
                                                </TableCell>
                                                <TableCell><Input value={item.reviewedBy} onChange={(e) => handleAreaInspectionItemChange('equipmentVerification', index, 'reviewedBy', e.target.value)} disabled={isPreview}/></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )
        }
        
        // Liquids form
        return (
            <div className="space-y-6">
                <Card className="rounded-xl">
                    <CardHeader><CardTitle>Inspección Higiénico-Sanitaria</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(formData.hygienicInspection || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                                <Label>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</Label>
                                <RadioGroup onValueChange={(v) => handleInputChange(`hygienicInspection.${key as keyof HygienicInspection}`, v as any)} value={value as string} className="flex" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="C" id={`${key}-c`}/><Label htmlFor={`${key}-c`}>C</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NC" id={`${key}-nc`}/><Label htmlFor={`${key}-nc`}>NC</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NA" id={`${key}-na`}/><Label htmlFor={`${key}-na`}>NA</Label></div>
                                </RadioGroup>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card className="rounded-xl">
                    <CardHeader><CardTitle>Verificación de Equipos de Medición</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                         {Object.entries(formData.equipmentVerification || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                                <Label>{key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</Label>
                                <RadioGroup onValueChange={(v) => handleInputChange(`equipmentVerification.${key as keyof EquipmentVerification}`, v as any)} value={value as string} className="flex" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="C" id={`${key}-c`}/><Label htmlFor={`${key}-c`}>C</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NC" id={`${key}-nc`}/><Label htmlFor={`${key}-nc`}>NC</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NA" id={`${key}-na`}/><Label htmlFor={`${key}-na`}>NA</Label></div>
                                </RadioGroup>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const renderFormContent = () => {
        switch (formType) {
             case 'pcc_liquids':
                return (
                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>VIII. Inspección del Punto de Control Crítico al Inicio de la Fabricación</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-2 border-b">
                                <Label>La malla del filtro se encuentra en buen estado (libre de desprendimientos, roturas y rayones)</Label>
                                <RadioGroup onValueChange={v => handleInputChange('filterMeshState', v as any)} value={formData.filterMeshState} className="flex gap-4" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="fms-si" /><Label htmlFor="fms-si">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="fms-no" /><Label htmlFor="fms-no">NO</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="flex justify-between items-center p-2 border-b">
                                <Label>Evidencia de partículas extrañas antes del funcionamiento del Filtro</Label>
                                <RadioGroup onValueChange={v => handleInputChange('foreignParticlesBefore', v as any)} value={formData.foreignParticlesBefore} className="flex gap-4" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="fpb-si" /><Label htmlFor="fpb-si">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="fpb-no" /><Label htmlFor="fpb-no">NO</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2 p-2">
                                <Label>Identificación del filtro</Label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <Input placeholder="Letras" value={formData.filterId?.letters || ''} onChange={e => handleInputChange('filterId.letters', e.target.value)} disabled={isPreview}/>
                                    <Input placeholder="Zona" value={formData.filterId?.zone || ''} onChange={e => handleInputChange('filterId.zone', e.target.value)} disabled={isPreview}/>
                                    <Input placeholder="Mesh" value={formData.filterId?.mesh || ''} onChange={e => handleInputChange('filterId.mesh', e.target.value)} disabled={isPreview}/>
                                    <Input placeholder="Letra" value={formData.filterId?.letter || ''} onChange={e => handleInputChange('filterId.letter', e.target.value)} disabled={isPreview}/>
                                    <Input placeholder="Tapadora" value={formData.filterId?.lid || ''} onChange={e => handleInputChange('filterId.lid', e.target.value)} disabled={isPreview}/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                <div className="space-y-2"><Label>Registrado por</Label><Input value={formData.responsible?.name} readOnly className="bg-muted"/></div>
                                <div className="space-y-2"><Label>Verificado por</Label><Input placeholder="Firma o nombre..." value={formData.reviewedBy} onChange={e => handleInputChange('reviewedBy', e.target.value)} disabled={isPreview}/></div>
                            </div>
                        </CardContent>
                    </Card>
                )
            case 'utensils-liquids':
                 return (
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>VII. Inspección de Utensilios y Artículos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label>Ha sido diligenciada la lista de chequeo de utensilios y elementos que entran al proceso</Label>
                                <RadioGroup onValueChange={(v) => handleInputChange('checklistCompleted', v as any)} value={formData.checklistCompleted} className="flex" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="clc-si" /><Label htmlFor="clc-si">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="clc-no" /><Label htmlFor="clc-no">NO</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utensilsReviewedBy">Revisado Por</Label>
                                <Input id="utensilsReviewedBy" value={formData.reviewedBy || ''} onChange={e => handleInputChange('reviewedBy', e.target.value)} disabled={isPreview} />
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'final-bulk-inspection':
                return (
                    <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>XII. Inspección del Bulto Final (Saldo)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label>El bulto se encuentra libre de material extraño</Label>
                                <RadioGroup onValueChange={(v) => handleInputChange('freeOfForeignMaterial', v as any)} value={formData.freeOfForeignMaterial} className="flex" disabled={isPreview}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="fof-si" /><Label htmlFor="fof-si">SI</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="fof-no" /><Label htmlFor="fof-no">NO</Label></div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="finalPackageInspection_registeredBy">Registrado Por</Label>
                                <Input id="finalPackageInspection_registeredBy" value={formData.finalPackageInspection_registeredBy || ''} onChange={e => handleInputChange('finalPackageInspection_registeredBy', e.target.value)} disabled={isPreview} />
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'pcc-final-inspection':
                return (
                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>XIII. Inspección del Punto de Control Crítico al Final de la Fabricación</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-md">
                                <div className="flex justify-between items-center">
                                    <Label>La malla del tamiz se encuentra en buen estado (libre de desprendimientos, roturas y rayones)</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('tamizInGoodState', v as any)} value={formData.tamizInGoodState} className="flex" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="tis-si" /><Label htmlFor="tis-si">SI</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="tis-no" /><Label htmlFor="tis-no">NO</Label></div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Identificación del Tamiz</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <Input placeholder="Letras" value={formData.tamizId?.letters || ''} onChange={e => handleInputChange('tamizId.letters', e.target.value)} disabled={isPreview}/>
                                        <Input placeholder="Zona" value={formData.tamizId?.zone || ''} onChange={e => handleInputChange('tamizId.zone', e.target.value)} disabled={isPreview}/>
                                        <Input placeholder="Mesh" value={formData.tamizId?.mesh || ''} onChange={e => handleInputChange('tamizId.mesh', e.target.value)} disabled={isPreview}/>
                                        <Input placeholder="Letra" value={formData.tamizId?.letter || ''} onChange={e => handleInputChange('tamizId.letter', e.target.value)} disabled={isPreview}/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Identificación de la Zaranda</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        <Input placeholder="Letras" value={formData.zarandaId?.letters || ''} onChange={(e) => handleInputChange('zarandaId.letters', e.target.value)} disabled={isPreview}/>
                                        <Input placeholder="Zona" value={formData.zarandaId?.zone || ''} onChange={(e) => handleInputChange('zarandaId.zone', e.target.value)} disabled={isPreview}/>
                                        <Input placeholder="Número" value={formData.zarandaId?.number || ''} onChange={(e) => handleInputChange('zarandaId.number', e.target.value)} disabled={isPreview}/>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-md">
                                <div className="space-y-2">
                                    <Label htmlFor="gramsRetained">Gramos de producto retenido en la malla</Label>
                                    <Input id="gramsRetained" type="number" value={formData.gramsRetained || ''} onChange={e => handleInputChange('gramsRetained', parseFloat(e.target.value))} disabled={isPreview}/>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label>Indique si lo retenido en la malla es propio del producto procesado</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('retainedIsFromProduct', v as any)} value={formData.retainedIsFromProduct} className="flex" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="rifp-si" /><Label htmlFor="rifp-si">SI</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="rifp-no" /><Label htmlFor="rifp-no">NO</Label></div>
                                    </RadioGroup>
                                </div>
                                {formData.retainedIsFromProduct === 'SI' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="retainedProductType">CUAL</Label>
                                        <Input id="retainedProductType" value={formData.retainedProductType || ''} onChange={e => handleInputChange('retainedProductType', e.target.value)} disabled={isPreview}/>
                                    </div>
                                )}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Registrado Por</Label>
                                    <Input value={currentUser?.name} readOnly disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Verificado Por</Label>
                                    <Input value={formData.reviewedBy || ''} onChange={e => handleInputChange('reviewedBy', e.target.value)} disabled={isPreview} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'area-clearance-powders':
                return renderAreaClearanceForm();
            case 'area-clearance-liquids':
                return renderAreaClearanceForm();
            case 'temp-humidity':
                return (
                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>IX. Inspección de Temperatura y Humedad al Inicio de la Fabricación</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperatura (°C)</Label>
                                <Input id="temperature" type="number" value={formData.temperature || ''} onChange={e => handleInputChange('temperature', parseFloat(e.target.value))} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="humidity">Humedad (%)</Label>
                                <Input id="humidity" type="number" value={formData.humidity || ''} onChange={e => handleInputChange('humidity', parseFloat(e.target.value))} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tempHumidityReviewedBy">Revisado por</Label>
                                <Input id="tempHumidityReviewedBy" value={formData.tempHumidityReviewedBy || ''} onChange={e => handleInputChange('tempHumidityReviewedBy', e.target.value)} disabled={isPreview}/>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'weighing':
                return (
                    <Card className="rounded-xl">
                        <CardHeader><CardTitle>XV. Pesaje</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Hora de Inicio de Pesaje</Label>
                                <Input type="time" value={formData.weighingTime || ''} onChange={e => handleInputChange('weighingTime', e.target.value)} disabled={isPreview}/>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'in-process-liquids':
                return renderInProcessLiquidsForm();
            case 'attribute-release':
                return renderAttributeReleaseForm();
            case 'magnet-inspection':
                return (
                    <div className="space-y-6">
                        <Card className="rounded-xl">
                            <CardHeader>
                                <CardTitle>XIV. Estado del Imán al Final de la Fabricación</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                     <div className="flex justify-between items-center">
                                        <Label>El imán se encuentra en buen estado</Label>
                                        <RadioGroup onValueChange={(v) => handleInputChange('magnetState', v as any)} value={formData.magnetState} className="flex" disabled={isPreview}>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="ms-si"/><Label htmlFor="ms-si">SI</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="ms-no"/><Label htmlFor="ms-no">NO</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="NA" id="ms-na"/><Label htmlFor="ms-na">NA</Label></div>
                                        </RadioGroup>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <Label>Libre de partículas metálicas adheridas</Label>
                                        <RadioGroup onValueChange={(v) => handleInputChange('freeOfParticles', v as any)} value={formData.freeOfParticles} className="flex" disabled={isPreview}>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="fp-si"/><Label htmlFor="fp-si">SI</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="fp-no"/><Label htmlFor="fp-no">NO</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="NA" id="fp-na"/><Label htmlFor="fp-na">NA</Label></div>
                                        </RadioGroup>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Novedades</Label>
                                    <Textarea value={formData.observations || ''} onChange={e => handleInputChange('observations', e.target.value)} disabled={isPreview}/>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Registrado por</Label><Input value={formData.responsible?.name || ''} readOnly className="bg-muted" /></div>
                                    <div className="space-y-2"><Label>Verificado por</Label><Input value={formData.reviewedBy || ''} onChange={e => handleInputChange('reviewedBy', e.target.value)} disabled={isPreview}/></div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl">
                             <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Hallazgos y Acciones Correctivas</CardTitle>
                                    <Button size="sm" onClick={addFinding} disabled={isPreview}><Plus className="mr-2 h-4 w-4"/>Añadir Hallazgo</Button>
                                </div>
                            </CardHeader>
                             <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Hallazgos</TableHead><TableHead>Acción Correctiva</TableHead><TableHead>Responsable</TableHead><TableHead>Fecha</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {(formData.findings || []).map((finding, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Textarea value={finding.finding} onChange={e => handleFindingChange(index, 'finding', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell><Textarea value={finding.correctiveAction} onChange={e => handleFindingChange(index, 'correctiveAction', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell><Input value={finding.responsible} onChange={e => handleFindingChange(index, 'responsible', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell><Input type="date" value={finding.date} onChange={e => handleFindingChange(index, 'date', e.target.value)} disabled={isPreview}/></TableCell>
                                                <TableCell><Button variant="destructive" size="icon" onClick={() => removeFinding(index)} disabled={isPreview}><Trash2 className="h-4 w-4"/></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </CardContent>
                        </Card>
                         <Card className="rounded-xl">
                            <CardHeader><CardTitle>Temperatura y Humedad</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Temperatura (°C)</Label>
                                    <Input type="number" value={formData.temperature || ''} onChange={e => handleInputChange('temperature', parseFloat(e.target.value))} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Humedad (%)</Label>
                                    <Input type="number" value={formData.humidity || ''} onChange={e => handleInputChange('humidity', parseFloat(e.target.value))} disabled={isPreview}/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Revisado por</Label>
                                    <Input value={formData.tempHumidityReviewedBy || ''} onChange={e => handleInputChange('tempHumidityReviewedBy', e.target.value)} disabled={isPreview}/>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-xl">
                             <CardHeader>
                                <CardTitle>Firmas de Operarios y Supervisores</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(formData.signatures || []).map((sig, index) => (
                                    <div key={index} className="space-y-2">
                                        <Label className="text-center block">{sig.role}</Label>
                                        <SignaturePad onSave={(s) => handleSignatureChange(index, s)} initialSignature={sig.signature} disabled={isPreview}/>
                                         <Input type="date" value={sig.date} onChange={e => {
                                            const updatedSignatures = [...(formData.signatures || [])];
                                            updatedSignatures[index].date = e.target.value;
                                            setFormData(prev => ({...prev, signatures: updatedSignatures}))
                                         }} disabled={isPreview}/>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                );
             case 'luminometry':
             case 'luminometry-liquids':
                return (
                    <div className="space-y-4">
                        <div className="overflow-x-auto responsive-table-container">
                            <Table className="responsive-table min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Inspección con Luminometría</TableHead>
                                        <TableHead>Resultado (URL)</TableHead>
                                        <TableHead>Cumple? (≤30)</TableHead>
                                        <TableHead>Insp. Sensorial (Olor/Color/Apariencia)</TableHead>
                                        <TableHead>Insp. Libre de Alérgenos</TableHead>
                                        <TableHead>Observaciones</TableHead>
                                        <TableHead>Realizado por</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(formData.luminometryItems || []).map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell data-label="Inspección" className="font-medium">{item.name}</TableCell>
                                            <TableCell data-label="Resultado">
                                                <Input type="number" value={item.result || ''} onChange={e => handleLuminometryItemChange(index, 'result', e.target.value)} className="w-24" disabled={isPreview}/>
                                            </TableCell>
                                            <TableCell data-label="Cumple?">
                                                <Badge variant={item.compliance === 'SI' ? 'default' : item.compliance === 'NO' ? 'destructive' : 'outline'}>
                                                    {item.compliance || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell data-label="Insp. Sensorial">
                                                <RadioGroup value={item.sensoryInspection} onValueChange={v => handleLuminometryItemChange(index, 'sensoryInspection', v)} className="flex gap-2" disabled={isPreview}>
                                                    <div className="flex items-center space-x-1"><RadioGroupItem value="Cumple" id={`sensory-c-${index}`}/><Label htmlFor={`sensory-c-${index}`} className="text-xs">C</Label></div>
                                                    <div className="flex items-center space-x-1"><RadioGroupItem value="No Cumple" id={`sensory-nc-${index}`}/><Label htmlFor={`sensory-nc-${index}`} className="text-xs">NC</Label></div>
                                                </RadioGroup>
                                            </TableCell>
                                             <TableCell data-label="Insp. Libre Alérgenos">
                                                <RadioGroup value={item.allergenInspection} onValueChange={v => handleLuminometryItemChange(index, 'allergenInspection', v)} className="flex gap-2" disabled={isPreview}>
                                                    <div className="flex items-center space-x-1"><RadioGroupItem value="Cumple" id={`allergen-c-${index}`}/><Label htmlFor={`allergen-c-${index}`} className="text-xs">C</Label></div>
                                                    <div className="flex items-center space-x-1"><RadioGroupItem value="No Cumple" id={`allergen-nc-${index}`}/><Label htmlFor={`allergen-nc-${index}`} className="text-xs">NC</Label></div>
                                                </RadioGroup>
                                            </TableCell>
                                            <TableCell data-label="Observaciones"><Textarea value={item.observations || ''} onChange={e => handleLuminometryItemChange(index, 'observations', e.target.value)} disabled={isPreview}/></TableCell>
                                            <TableCell data-label="Realizado por"><Input value={item.reviewedBy || ''} onChange={e => handleLuminometryItemChange(index, 'reviewedBy', e.target.value)} disabled={isPreview} className="w-40"/></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )
            case 'scales':
            case 'scales-liquids':
                return renderScalesTable();
            case 'sensory':
                return (
                     <>
                        <div className="space-y-2">
                            <Label>Lote de Producción</Label>
                             <Select onValueChange={(v) => {
                                      const selectedLog = productionData.find(l => l.lot === v);
                                      if (selectedLog) {
                                          setFormData(prev => ({
                                              ...prev,
                                              lot: selectedLog.lot,
                                              product: selectedLog.product
                                          }));
                                      }
                                 }} value={formData.lot} disabled={isPreview}>
                                <SelectTrigger><SelectValue placeholder="Seleccione un lote" /></SelectTrigger>
                                <SelectContent>{productionData.filter(l => l.lot).map(log => (<SelectItem key={log.id} value={log.lot!}>{log.lot} - {log.product}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2"> <Label>Olor</Label> <RadioGroup onValueChange={(v) => handleInputChange('odor', v)} value={formData.odor} disabled={isPreview}><div className="flex items-center space-x-2"><RadioGroupItem value="Conforme" id="o-conforme"/><Label htmlFor="o-conforme">Conforme</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No Conforme" id="o-no-conforme"/><Label htmlFor="o-no-conforme">No Conforme</Label></div></RadioGroup> </div>
                            <div className="space-y-2"> <Label>Color</Label> <RadioGroup onValueChange={(v) => handleInputChange('color', v)} value={formData.color} disabled={isPreview}><div className="flex items-center space-x-2"><RadioGroupItem value="Conforme" id="c-conforme"/><Label htmlFor="c-conforme">Conforme</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No Conforme" id="c-no-conforme"/><Label htmlFor="c-no-conforme">No Conforme</Label></div></RadioGroup> </div>
                            <div className="space-y-2"> <Label>Apariencia</Label> <RadioGroup onValueChange={(v) => handleInputChange('appearance', v)} value={formData.appearance} disabled={isPreview}><div className="flex items-center space-x-2"><RadioGroupItem value="Conforme" id="a-conforme"/><Label htmlFor="a-conforme">Conforme</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="No Conforme" id="a-no-conforme"/><Label htmlFor="a-no-conforme">No Conforme</Label></div></RadioGroup> </div>
                        </div>
                    </>
                );
            case 'in-process':
                return (
                   <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>X. Muestreo y Control en Proceso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Lote de Producción</Label>
                                     <Select onValueChange={(v) => {
                                      const selectedLog = productionData.find(l => l.lot === v);
                                      if (selectedLog) {
                                          setFormData(prev => ({
                                              ...prev,
                                              lot: selectedLog.lot,
                                              product: selectedLog.product,
                                              counterSampleLot: selectedLog.lot
                                          }));
                                      }
                                     }} value={formData.lot} disabled={isPreview}>
                                        <SelectTrigger><SelectValue placeholder="Seleccione un lote" /></SelectTrigger>
                                        <SelectContent>{productionData.filter(l => l.type === 'powder' && l.lot).map(log => (<SelectItem key={log.id} value={log.lot!}>{log.lot} - {log.product}</SelectItem>))}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sampledPackages"># Consecutivo</Label>
                                    <Input id="sampledPackages" type="number" value={formData.sampledPackages || ''} onChange={e => handleInputChange('sampledPackages', parseFloat(e.target.value))} disabled={isPreview} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="counterSampleLot">Lote Contramuestra</Label>
                                    <Input id="counterSampleLot" value={formData.counterSampleLot || ''} readOnly className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="humidity">% Humedad (&lt; 5%)</Label>
                                    <Input id="humidity" type="number" value={formData.humidity || ''} onChange={e => handleInputChange('humidity', parseFloat(e.target.value))} disabled={isPreview} />
                                </div>
                            </div>
                             <div className="space-y-4">
                                <Label className="font-semibold">Foto</Label>
                                <div className="flex items-center gap-4">
                                    <Button asChild variant="outline" size="sm">
                                        <label htmlFor="photo-upload" className="cursor-pointer">
                                            <Upload className="mr-2 h-4 w-4"/>
                                            <span>{photoFile ? 'Cambiar foto' : 'Subir foto'}</span>
                                        </label>
                                    </Button>
                                    <Input id="photo-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" disabled={isPreview} />
                                    <Button variant="outline" size="sm" onClick={() => setIsCameraOpen(true)} disabled={isPreview}>
                                        <Camera className="mr-2 h-4 w-4" />
                                        Tomar Foto
                                    </Button>
                                    {photoPreview && (
                                        <div className="relative w-24 h-24 border rounded-md">
                                            <Image src={photoPreview} alt="Vista previa" layout="fill" objectFit="cover" className="rounded-md" />
                                        </div>
                                    )}
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label>Apariencia Producto VS Contramuestra</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('appearanceVsSample', v as any)} value={formData.appearanceVsSample} className="flex space-x-4 pt-2" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="C" id="app-c" /><Label htmlFor="app-c">C</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NC" id="app-nc" /><Label htmlFor="app-nc">NC</Label></div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('colorVsSample', v as any)} value={formData.colorVsSample} className="flex space-x-4 pt-2" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="C" id="color-c" /><Label htmlFor="color-c">C</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="NC" id="color-nc" /><Label htmlFor="color-nc">NC</Label></div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Resultado Final</Label>
                                    <RadioGroup onValueChange={(v) => handleInputChange('inProcessStatus', v as any)} value={formData.inProcessStatus} className="flex space-x-4 pt-2" disabled={isPreview}>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Conforme" id="status-conforme" /><Label htmlFor="status-conforme">Conforme</Label></div>
                                        <div className="flex items-center space-x-2"><RadioGroupItem value="No Conforme" id="status-no-conforme" /><Label htmlFor="status-no-conforme">No Conforme</Label></div>
                                    </RadioGroup>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <Label>Registrado por</Label>
                                <Input value={formData.responsible?.name || ''} readOnly className="bg-muted"/>
                            </div>
                        </CardContent>
                   </Card>
                );
            case 'finished-product':
                const isLiquidsFlow = activeHygieneLog?.product?.toLowerCase().includes('liquido');
                return (
                    <div className="space-y-6">
                        <Card className="rounded-xl">
                             <CardHeader>
                                <CardTitle>XI. Envasado y Empaque</CardTitle>
                                <CardDescription>
                                    {isLiquidsFlow
                                        ? "Bidones con capacidad de __ kg (Peso: +/- 1%)"
                                        : "Bolsa de polietileno contenida en bolsa kraft con capacidad de 25 kg (Peso: +/- 1%)"
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     {isLiquidsFlow && (
                                        <div className="space-y-2">
                                            <Label htmlFor="drumCapacity">Capacidad Bidones (kg)</Label>
                                            <Input id="drumCapacity" type="number" value={formData.drumCapacity || ''} onChange={e => handleInputChange('drumCapacity', e.target.value)} disabled={isPreview} />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label htmlFor="packagingStartTime">Hora de Inicio</Label>
                                        <Input id="packagingStartTime" type="time" value={formData.packagingStartTime || ''} onChange={e => handleInputChange('packagingStartTime', e.target.value)} disabled={isPreview} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="packagingEndTime">Hora Final</Label>
                                        <Input id="packagingEndTime" type="time" value={formData.packagingEndTime || ''} onChange={e => handleInputChange('packagingEndTime', e.target.value)} disabled={isPreview} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="packagingRegisteredBy">Registrado Por</Label>
                                        <Input id="packagingRegisteredBy" value={formData.packagingRegisteredBy || ''} onChange={e => handleInputChange('packagingRegisteredBy', e.target.value)} disabled={isPreview} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="mb-2 block font-semibold">Serie de {isLiquidsFlow ? 'Bidones' : 'Bultos'} Empacados</Label>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Consecutivo Inicial</TableHead>
                                                <TableHead>Consecutivo Final</TableHead>
                                                {!isPreview && <TableHead className="w-[50px]"></TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(formData.packagingSeries || []).map((serie, index) => (
                                                <TableRow key={index}>
                                                    <TableCell><Input value={serie.initial} onChange={e => handlePackagingSeriesChange(index, 'initial', e.target.value)} disabled={isPreview}/></TableCell>
                                                    <TableCell><Input value={serie.final} onChange={e => handlePackagingSeriesChange(index, 'final', e.target.value)} disabled={isPreview}/></TableCell>
                                                    {!isPreview && (
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => removePackagingSeriesRow(index)} disabled={(formData.packagingSeries || []).length <= 1}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {!isPreview && (
                                        <Button variant="outline" size="sm" onClick={addPackagingSeriesRow} className="mt-2">
                                            <Plus className="mr-2 h-4 w-4" /> Añadir Fila
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'endowment':
                return (
                     <Card className="rounded-xl">
                        <CardHeader>
                            <CardTitle>VI. Inspección de Operarios y Elementos de Protección Individual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ítem</TableHead>
                                        <TableHead className="w-[200px]">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(formData.endowmentItems || []).map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell>
                                                <RadioGroup onValueChange={(v) => handleEndowmentItemChange(index, v as any)} value={item.status} className="flex" disabled={isPreview}>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="Conforme" id={`e-conf-${index}`} /><Label htmlFor={`e-conf-${index}`}>Conforme</Label></div>
                                                    <div className="flex items-center space-x-2"><RadioGroupItem value="No Conforme" id={`e-noconf-${index}`} /><Label htmlFor={`e-noconf-${index}`}>No Conforme</Label></div>
                                                </RadioGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombres del Personal Revisado</Label>
                                    <Textarea value={formData.personnelNames || ''} onChange={e => handleInputChange('personnelNames', e.target.value)} disabled={isPreview} placeholder="Listar nombres separados por coma"/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Revisado Por</Label>
                                    <Input value={formData.reviewedBy || ''} readOnly className="bg-muted"/>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            case 'pcc':
                 return (
                     <div className="space-y-4">
                         <div className="p-4 border rounded-md space-y-4">
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                 <Label>La malla del tamiz se encuentra en buen estado</Label>
                                 <RadioGroup onValueChange={(v) => handleInputChange('tamizInGoodState', v as 'SI' | 'NO')} value={formData.tamizInGoodState} className="flex mt-2 sm:mt-0" disabled={isPreview}><div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="t-si" /><Label htmlFor="t-si">SI</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="t-no" /><Label htmlFor="t-no">NO</Label></div></RadioGroup>
                             </div>
                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                 <Label>Evidencia de partículas extrañas antes del funcionamiento</Label>
                                 <RadioGroup onValueChange={(v) => handleInputChange('foreignParticlesEvidence', v as 'SI' | 'NO')} value={formData.foreignParticlesEvidence} className="flex mt-2 sm:mt-0" disabled={isPreview}><div className="flex items-center space-x-2"><RadioGroupItem value="SI" id="p-si" /><Label htmlFor="p-si">SI</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="NO" id="p-no" /><Label htmlFor="p-no">NO</Label></div></RadioGroup>
                             </div>
                         </div>
                         <Card className="rounded-xl">
                             <CardHeader><CardTitle className="text-base">Identificación</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                 <div className="space-y-2">
                                     <Label>Identificación del Tamiz</Label>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                         <Input placeholder="Letras" value={formData.tamizId?.letters || ''} onChange={(e) => handleInputChange('tamizId.letters', e.target.value)} disabled={isPreview}/>
                                         <Input placeholder="Zona" value={formData.tamizId?.zone || ''} onChange={(e) => handleInputChange('tamizId.zone', e.target.value)} disabled={isPreview}/>
                                         <Input placeholder="Mesh" value={formData.tamizId?.mesh || ''} onChange={(e) => handleInputChange('tamizId.mesh', e.target.value)} disabled={isPreview}/>
                                         <Input placeholder="Letra" value={formData.tamizId?.letter || ''} onChange={(e) => handleInputChange('tamizId.letter', e.target.value)} disabled={isPreview}/>
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Identificación de la Zaranda</Label>
                                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                         <Input placeholder="Letras" value={formData.zarandaId?.letters || ''} onChange={(e) => handleInputChange('zarandaId.letters', e.target.value)} disabled={isPreview}/>
                                         <Input placeholder="Zona" value={formData.zarandaId?.zone || ''} onChange={(e) => handleInputChange('zarandaId.zone', e.target.value)} disabled={isPreview}/>
                                         <Input placeholder="Número" value={formData.zarandaId?.number || ''} onChange={(e) => handleInputChange('zarandaId.number', e.target.value)} disabled={isPreview}/>
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <Label htmlFor="mixingTankId">Identificación del tanque de mezcla</Label>
                                     <Input id="mixingTankId" value={formData.mixingTankId || ''} onChange={(e) => handleInputChange('mixingTankId', e.target.value)} disabled={isPreview}/>
                                 </div>
                             </CardContent>
                         </Card>
                     </div>
                 );
            
            case 'utensils':
                 return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Utensilio</Label>
                            <Input id="name" value={formData.name || ''} onChange={e => handleInputChange('name', e.target.value)} disabled={isPreview}/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="entry">Cantidad de Entrada</Label>
                                <Input id="entry" type="number" value={formData.entry || ''} onChange={(e) => handleInputChange('entry', Number(e.target.value))} disabled={isPreview}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="exit">Cantidad de Salida</Label>
                                <Input id="exit" type="number" value={formData.exit || ''} onChange={(e) => handleInputChange('exit', Number(e.target.value))} disabled={isPreview}/>
                            </div>
                        </div>
                    </>
                );
            default:
                return <p>Tipo de formulario no configurado.</p>
        }
    };
    
    const Wrapper = isPrintView ? 'div' : PageHeader;
    const hygieneLink = formType.includes('liquids') ? '/quality/hygiene/liquids/new' : '/quality/hygiene/powders/new';
    
    return (
        <>
            <Wrapper title={isPreview ? `Vista Previa: ${title}` : isEditing ? `Editar: ${title}` : `Registrar: ${title}`}>
                {!isPrintView && (
                     <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={backLink}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        {!isPreview && <Button onClick={handleSubmit} disabled={isSaving || (!isEditing && !activeHygieneLog)}>
                            {isSaving ? <Loader2 className="animate-spin mr-2"/> : null}
                            {isSaving ? 'Guardando...' : 'Guardar Registro'}
                        </Button>}
                    </div>
                )}
            </Wrapper>
            <div className="space-y-4 max-w-4xl mx-auto p-1">
                {!isEditing && (
                     activeHygieneLog ? (
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Estas haciendo el registro de la Fabricación de</AlertTitle>
                            <AlertDescription>
                                <strong>{activeHygieneLog.product} (Lote: {activeHygieneLog.lot}, Item: {activeHygieneLog.item})</strong>.
                            </AlertDescription>
                        </Alert>
                     ) : (
                         <Alert variant="destructive">
                            <Info className="h-4 w-4" />
                            <AlertTitle>No hay ciclo activo</AlertTitle>
                            <AlertDescription>
                                No se encontró un registro de higiene activo. Por favor, <Link href={hygieneLink} className="underline font-semibold">crea un nuevo registro de higiene</Link> para iniciar un ciclo.
                            </AlertDescription>
                        </Alert>
                     )
                )}

                 <Card className="rounded-xl">
                    <CardHeader>
                        <CardTitle>Información de la Fabricación</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Producto</Label>
                            <Input value={formData.product || ''} readOnly className="bg-muted"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Lote</Label>
                            <Input value={formData.lot || ''} readOnly className="bg-muted"/>
                        </div>
                         <div className="space-y-2">
                            <Label>Item</Label>
                            <Input value={formData.item || ''} readOnly className="bg-muted"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input value={formData.date || ''} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Responsable</Label>
                            <Input value={formData.responsible?.name || ''} readOnly className="bg-muted" />
                        </div>
                    </CardContent>
                </Card>

                {renderFormContent()}

                <Card className="rounded-xl">
                    <CardHeader><CardTitle>Observaciones y Firma</CardTitle></CardHeader>
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
            
            <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tomar Foto</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Acceso a la cámara denegado</AlertTitle>
                                <AlertDescription>
                                    Por favor, habilita los permisos de cámara en tu navegador.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCapture} disabled={!hasCameraPermission}>Capturar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}



    
