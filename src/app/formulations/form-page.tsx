
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { FileUp, FileSpreadsheet, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addOrUpdate, getById } from '@/services/firestoreService';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const FORMULATION_COLLECTION_NAME = "formulations";

export interface Formulation {
    id: string;
    item: string;
    name: string;
    ingredients: number;
    lastUpdated: string;
    fileName: string;
    fileBase64?: string;
    fileType?: string;
    data: string;
    isInitial: boolean;
}

export default function FormulationsFormPage({ formulationId }: { formulationId?: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [excelData, setExcelData] = useState<(string | number)[][]>([]);
    const [fileBase64, setFileBase64] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [extractedItem, setExtractedItem] = useState("");
    const [extractedProductName, setExtractedProductName] = useState("");
    const [existingFormulation, setExistingFormulation] = useState<Formulation | null>(null);

    const router = useRouter();
    const { toast } = useToast();
    const isEditing = !!formulationId;

    useEffect(() => {
        if (isEditing) {
            getById<Formulation>(FORMULATION_COLLECTION_NAME, formulationId).then(formulation => {
                if (formulation) {
                    setExistingFormulation(formulation);
                    setExtractedItem(formulation.item);
                    setExtractedProductName(formulation.name);
                    setFileBase64(formulation.fileBase64 || "");
                    const file = dataURLtoFile(formulation.fileBase64 || "", formulation.fileName);
                    setFile(file);
                    if (formulation.data) {
                        setExcelData(JSON.parse(formulation.data));
                    }
                } else {
                    toast({ variant: "destructive", title: "Error", description: "No se encontró la formulación." });
                    router.push('/formulations/powders');
                }
            });
        }
    }, [isEditing, formulationId, router, toast]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const selectedFile = event.target.files[0];
            setFile(selectedFile);
            setIsProcessing(true);

            const reader = new FileReader();
            reader.onload = (e) => {
                const buffer = e.target?.result;
                if(buffer) {
                    try {
                        const workbook = XLSX.read(buffer, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        setExcelData(json as (string|number)[][]);

                        const item = worksheet['B1'] ? String(worksheet['B1'].v) : "N/A";
                        const productName = worksheet['B2'] ? String(worksheet['B2'].v) : selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');

                        setExtractedItem(item);
                        setExtractedProductName(productName);

                        const base64Reader = new FileReader();
                        base64Reader.onloadend = () => {
                            setFileBase64(base64Reader.result as string);
                            setIsProcessing(false);
                        };
                        base64Reader.readAsDataURL(selectedFile);

                    } catch (error) {
                        console.error("Error reading Excel file:", error);
                        setIsProcessing(false);
                    }
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };
    
    const handleSubmit = async () => {
        if(file && excelData.length > 0 && fileBase64 && !isProcessing) {
            setIsSaving(true);
            try {
                const newOrUpdatedFormulation: Formulation = {
                    id: formulationId || Date.now().toString(),
                    item: extractedItem,
                    name: extractedProductName,
                    ingredients: excelData.length > 1 ? excelData.length -1 : 0,
                    lastUpdated: new Date().toISOString().split('T')[0],
                    fileName: file.name,
                    fileBase64: fileBase64,
                    fileType: file.type,
                    data: JSON.stringify(excelData),
                    isInitial: existingFormulation ? existingFormulation.isInitial : false
                };
                await addOrUpdate(FORMULATION_COLLECTION_NAME, newOrUpdatedFormulation);
                toast({ title: "Éxito", description: `Formulación "${newOrUpdatedFormulation.name}" guardada.` });
                router.push('/formulations/powders');
            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la formulación." });
            } finally {
                setIsSaving(false);
            }
        }
    }

    return (
        <>
            <PageHeader title={isEditing ? 'Editar Formulación' : 'Crear Nueva Formulación'}>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/formulations/powders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Cancelar
                        </Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={!file || isProcessing || isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        {isSaving ? 'Guardando...' : 'Guardar Formulación'}
                    </Button>
                </div>
            </PageHeader>
            <div className="max-w-2xl mx-auto space-y-6">
                <p className="text-sm text-muted-foreground">
                    Sube un archivo de Excel (.xlsx, .xls). El sistema extraerá el "Item" de la celda B1 y el "Nombre del Producto" de la celda B2.
                </p>
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="excel-file">Archivo de Excel</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="excel-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {file ? (
                                    <>
                                        <FileSpreadsheet className="w-10 h-10 mb-3 text-primary" />
                                        <p className="mb-2 text-sm text-foreground"><span className="font-semibold">Archivo seleccionado:</span></p>
                                        <p className="text-xs text-muted-foreground">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                        <p className="text-xs text-muted-foreground">XLSX, XLS (MAX. 5MB)</p>
                                    </>
                                )}
                            </div>
                            <Input id="excel-file" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                        </label>
                    </div>
                </div>
                {isProcessing && <p className="text-center text-sm text-muted-foreground">Procesando archivo...</p>}
                {extractedItem && extractedProductName && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-sm">
                        <h4 className="font-semibold mb-2">Datos Extraídos del Excel:</h4>
                        <p><span className="font-medium">Item (ID Producto):</span> {extractedItem}</p>
                        <p><span className="font-medium">Nombre Producto:</span> {extractedProductName}</p>
                    </div>
                )}
            </div>
        </>
    );
}

const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    if (!dataurl) return null;
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};
