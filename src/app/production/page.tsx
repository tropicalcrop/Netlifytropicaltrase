

import { type UserData } from "@/app/users/page";
import { redirect } from 'next/navigation';

export interface ProductionIngredient {
    ref: string;
    name: string;
    tare?: number;
    quantity: number;
    unit: 'kg' | 'g' | 'Lt' | 'ml' | 'Und';
    lot: string;
    check: 'C' | 'NC' | null;
    adjustment: '+' | '-' | null;
    responsible?: Partial<UserData>;
    attentionTo?: string;
}

export interface ProductionStage {
    name: string;
    attentionTo?: string;
    startTime?: string;
    endTime?: string;
    responsible?: Partial<UserData>;
    ingredients: ProductionIngredient[];
}

export interface PackagingMaterial {
    product: string;
    ref: string;
    quantity: number;
    unit: string;
    lot: string;
}

export interface ProductionData {
    id: string;
    type: 'powder' | 'liquid';
    product?: string;
    item?: string;
    lot?: string;
    formulationId?: string;
    status?: 'Pendiente' | 'En Progreso' | 'Completado';
    date?: string;
    carga?: string;
    cliente?: string;
    orden?: string;
    productionOrder?: number;
    
    // Powder specific
    startTime?: string;
    endTime?: string;
    responsible?: Partial<UserData>;
    ingredients?: ProductionIngredient[];
    finalProductTheoreticalPowder?: number;
    finalProductTheoreticalLiquid?: number; // Keep for powders if needed
    finalProductReal?: number;
    performance?: number;
    packagingMaterials?: PackagingMaterial[]; // Generic packaging
    observations?: string;
    signature?: string;
    supervisorSignature?: string;
    productionLeadSignature?: string;

    // Liquid specific
    stages?: ProductionStage[];
    finalProductTheoretical?: number; // Total theoretical for liquids
    responsibleVerification?: Partial<UserData>;
}


export default function ProductionRedirectPage() {
    // Redirect to the first tab by default
    redirect('/production/powders')
}


