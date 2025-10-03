

import { type UserData } from "@/app/users/page";

export type QualityFormType = 
    | 'luminometry'
    | 'luminometry-liquids'
    | 'sensory'
    | 'in-process'
    | 'in-process-liquids'
    | 'finished-product'
    | 'final-bulk-inspection'
    | 'endowment'
    | 'pcc'
    | 'pcc_liquids'
    | 'pcc-final-inspection'
    | 'scales'
    | 'scales-liquids'
    | 'utensils'
    | 'utensils-liquids'
    | 'magnet-inspection'
    | 'attribute-release'
    | 'weighing'
    | 'temp-humidity'
    | 'area-clearance-powders'
    | 'area-clearance-liquids'
    | 'hygiene'
    | 'hygiene_liquids';

type StatusOption = 'C' | 'NC' | 'NA' | '';
type YesNoNaOption = 'SI' | 'NO' | 'NA';
type YesNoOption = 'SI' | 'NO';


export interface LuminometryItem {
    name: string;
    result?: number;
    compliance?: 'SI' | 'NO';
    sensoryInspection?: 'Cumple' | 'No Cumple';
    allergenInspection?: 'Cumple' | 'No Cumple';
    reviewedBy?: string;
    observations?: string;
}

export interface HygienicInspection {
    [key: string]: StatusOption;
}

export interface EquipmentVerification {
    [key: string]: StatusOption;
}

export interface AreaInspectionItem {
    name: string;
    status: YesNoOption;
    reviewedBy: string;
}

export interface EquipmentDetails {
    equipment: string;
    seriesModel: string;
    fixedPointError: number;
    platePointError: number;
    testRows?: TestRow[];
}

export interface TestRow {
    standardWeight: string;
    repeatability: (number | null)[]; // Array of 4 numbers
    eccentricity: (number | null)[]; // Array of 5 numbers
    usage: {
        mp: boolean;
        pt: boolean;
        v: boolean;
    };
    compliance: 'Cumple' | 'No Cumple' | '';
}

export interface PackagingSeries {
    initial: string;
    final: string;
}

export interface Finding {
    id?: string;
    finding: string;
    correctiveAction: string;
    responsible: string;
    date: string;
}

export interface SignatureEntry {
    role: string;
    signature?: string;
    date?: string;
}

export interface AttributeCheck {
    reviewedUnits?: number;
    consecutive?: string;
    time?: string;
    weightVerification?: string;
    status?: 'C' | 'NC';
}


export interface InProcessTableRow {
    parameter: 'AVAL' | 'INICIO' | 'MEDIO' | 'FINAL';
    hour?: string;
    temperature?: number;
    density?: number;
    brix?: number;
    color?: string;
    ph?: number;
    phDiluted?: number;
}

export interface RawMaterialMonitoring {
    itemName?: string;
    lot?: string;
    density?: number;
    brix?: number;
    temperature?: number;
    ph?: number;
    photoUrl?: string;
}

export interface EndowmentItem {
    name: string;
    status: 'Conforme' | 'No Conforme';
}

export interface FilterId {
    letters: string;
    zone: string;
    mesh: string;
    letter: string;
    lid?: string;
}

export interface QualityData {
    id: string;
    date: string;
    responsible: Partial<UserData>;
    signature: string;
    observations?: string;
    cycleId?: string | null;
    
    // Common fields
    status?: string;
    product?: string;
    lot?: string;
    item?: string;
    area?: string;
    client?: string;
    order?: string;
    hygieneLogId?: string;

    // Area Clearance
    zoneCode?: string;
    hygienicInspection?: HygienicInspection | AreaInspectionItem[];
    equipmentVerification?: EquipmentVerification | AreaInspectionItem[];

    // Luminometry (now a list of items)
    luminometryItems?: LuminometryItem[];

    // Sensory
    odor?: 'Conforme' | 'No Conforme';
    color?: 'Conforme' | 'No Conforme';
    appearance?: 'Conforme' | 'No Conforme';
    result?: string;

    // In-Process (Powders)
    sampledPackages?: number;
    counterSampleLot?: string;
    appearanceVsSample?: 'C' | 'NC';
    colorVsSample?: 'C' | 'NC';
    humidity?: number;
    inProcessStatus?: 'Conforme' | 'No Conforme';
    photoUrl?: string;
    
    // In-Process (Old fields for liquids, might need to deprecate or merge)
    mixType?: string;
    brix?: number;
    ph?: number;

    // In-Process (Liquids - New detailed form)
    drumsSampled?: number;
    referenceLot?: string;
    inProcessAppearance?: 'Cumple' | 'No Cumple';
    inProcessTable?: InProcessTableRow[];
    rawMaterialMonitoring?: RawMaterialMonitoring;


    // Finished Product
    drumCapacity?: number;
    packagingStartTime?: string;
    packagingEndTime?: string;
    packagingRegisteredBy?: string;
    packagingSeries?: PackagingSeries[];
    finalPackageInspection_freeOfForeignMaterial?: 'SI' | 'NO';
    finalPackageInspection_registeredBy?: string;

    // Final Bulk Inspection
    freeOfForeignMaterial?: YesNoOption;


    // Endowment
    personnelNames?: string;
    endowmentItems?: EndowmentItem[];
    reviewedBy?: string;


    // PCC (Powders)
    tamizInGoodState?: 'SI' | 'NO';
    foreignParticlesEvidence?: 'SI' | 'NO';
    tamizId?: {
        letters: string;
        zone: string;
        mesh: string;
        letter: string;
    };
    zarandaId?: {
        letters: string;
        zone: string;
        number: string;
    };
    mixingTankId?: string;
    verifierSignature?: string;

    // PCC (Liquids)
    filterMeshState?: YesNoOption;
    foreignParticlesBefore?: YesNoOption;
    filterId?: FilterId;


    // PCC Final Inspection
    gramsRetained?: number;
    retainedIsFromProduct?: YesNoOption;
    retainedProductType?: string;
    particlesFound?: YesNoNaOption;
    lotReleased?: YesNoNaOption;

    // Scales (both liquids and powders)
    equipmentDetails?: EquipmentDetails[];
    testRows?: TestRow[]; // This will now be part of equipmentDetails
    scale?: string; 
    testType?: 'Excentricidad' | 'Repetitividad'; 
    patternWeight?: number;
    unit?: 'g' | 'kg';
    readings?: Record<string, number>; 

    // Utensils
    name?: string;
    entry?: number;
    exit?: number;
    
    // Utensils Liquids
    checklistCompleted?: 'SI' | 'NO';


    // Temp & Humidity
    temperature?: number;
    // humidity?: number; // This is already on QualityData
    tempHumidityReviewedBy?: string;

    // Magnet Inspection
    magnetState?: YesNoNaOption;
    freeOfParticles?: YesNoNaOption;
    findings?: Finding[];
    // reviewedBy?: string; // Already exists for endowment
    signatures?: SignatureEntry[];

    // Attribute Release
    attributeRelease?: {
        packaging: AttributeCheck;
        packing: AttributeCheck;
        identification: AttributeCheck;
        hermeticity: AttributeCheck;
    };
    releaseDate?: string;
    releasedBy?: string;

    // Weighing
    weighingTime?: string;
    weight?: number;
}

export const initialLuminometryItemsPowders: LuminometryItem[] = [
    { name: 'Imán (Cuando aplique)' },
    { name: 'Mezclador' },
    { name: 'Salida del mezclador' },
    { name: 'Malla y zaranda' },
    { name: 'Manguera de descarga' },
    { name: 'Utensilios' },
    { name: 'Otro (EQUIPOS DE ENSAYO)' },
    { name: 'Otro' },
    { name: 'Otro:' },
];

export const initialLuminometryItemsLiquids: LuminometryItem[] = [
    { name: 'Tanque de pre-mezcla', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Tanque de mezcla', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Filtro', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Tanque de balance', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Tubería - Bombas', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Tanque de envasado', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Mangueras', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Utensilios', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Otro:(EQUIPOS DE ENSAYO)', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
    { name: 'Otro', sensoryInspection: 'Cumple', allergenInspection: 'Cumple' },
];

export const initialScalesLiquidsData: { equipmentDetails: EquipmentDetails[], testRows: TestRow[] } = {
    equipmentDetails: [],
    testRows: []
};

export const initialScalesPowdersData: { equipmentDetails: EquipmentDetails[], testRows: TestRow[] } = {
    equipmentDetails: [],
    testRows: []
};

export const initialMagnetInspectionData: Partial<QualityData> = {
    magnetState: 'SI',
    freeOfParticles: 'SI',
    findings: [],
    temperature: undefined,
    humidity: undefined,
    reviewedBy: '',
    signatures: [
        { role: 'Operario de Pesaje' },
        { role: 'Operario de Fabricación' },
        { role: 'Operario de Envasado' },
        { role: 'Operario Encargado del PCC' },
        { role: 'VoBo Supervisión de Planta' },
        { role: 'VoBo Jefe de Producción' },
    ],
};

export const initialAttributeReleaseData: Partial<QualityData> = {
    attributeRelease: {
        packaging: {},
        packing: {},
        identification: {},
        hermeticity: {}
    },
    releaseDate: '',
    releasedBy: '',
    observations: ''
};

export const initialInProcessLiquidsData: Partial<QualityData> = {
    drumsSampled: 0,
    referenceLot: '',
    inProcessAppearance: 'Cumple',
    rawMaterialMonitoring: {},
    inProcessTable: [
        { parameter: 'AVAL' },
        { parameter: 'INICIO' },
        { parameter: 'MEDIO' },
        { parameter: 'FINAL' },
    ]
};

export const initialAreaClearancePowdersData: Partial<QualityData> = {
    hygienicInspection: [
        { name: 'Pisos, plataformas, escaleras', status: 'SI', reviewedBy: '' },
        { name: 'Mesones, instrumentos de medida', status: 'SI', reviewedBy: '' },
        { name: 'Imán (Cuando aplique)', status: 'SI', reviewedBy: '' },
        { name: 'Mezclador de cintas', status: 'SI', reviewedBy: '' },
        { name: 'Cosedora', status: 'SI', reviewedBy: '' },
        { name: 'Válvulas, Ductos', status: 'SI', reviewedBy: '' },
        { name: 'Pulsadores, Utensilios', status: 'SI', reviewedBy: '' },
        { name: 'Estibas', status: 'SI', reviewedBy: '' },
        { name: 'Etiquetas (Legibles, información conforme al producto a procesar)', status: 'SI', reviewedBy: '' },
        { name: 'Empaque (Libre de material Extraño, sin perforación, sin manchas, buen estado)', status: 'SI', reviewedBy: '' },
    ],
    equipmentVerification: [
        { name: 'Balanza TEK B12. Capacidad 150 kg', status: 'SI', reviewedBy: '' },
        { name: 'Balanza TEK B8. Capacidad 150 kg', status: 'SI', reviewedBy: '' },
        { name: 'Bascula BBG B27. Capacidad 3 Kg', status: 'SI', reviewedBy: '' },
        { name: 'Determidador de Humedad AND DH-29-01 Capacidad 51 g', status: 'SI', reviewedBy: '' },
        { name: 'Mezclador de cintas(verifique parte interna)', status: 'SI', reviewedBy: '' },
        { name: 'Zaranda', status: 'SI', reviewedBy: '' },
        { name: 'Termohigrometro', status: 'SI', reviewedBy: '' },
        { name: 'Cosedora (Aguja y partes moviles completas, en buen estado)', status: 'SI', reviewedBy: '' },
        { name: 'Extractor encendido', status: 'SI', reviewedBy: '' },
        { name: 'Otros:', status: 'SI', reviewedBy: '' },
    ],
    status: 'Conforme',
    zoneCode: '',
};

export const initialAreaClearanceLiquidsData: Partial<QualityData> = {
    hygienicInspection: {
        pisos_plataformas_escaleras: 'C',
        mesones_instrumentos_de_medida: 'C',
        tanques_tapas_agitadores: 'C',
        tuberias_valvulas_empaues_mangueras: 'C',
        filtro: 'C',
        utensilios: 'C',
        estibas: 'C',
        etiquetas_legibles_informacion_conforme: 'C',
        empaque_libre_de_material_extrano: 'C',
    },
    equipmentVerification: {
        balanza_lexus_b19_100kg: 'C',
        balanza_lexus_b17_30kg: 'C',
        agitadores_verifique_parte_interna: 'C',
        bombas: 'C',
        refractometro_atago_pal_2: 'C',
        ph_metro: 'NA',
        balanza_and_capacidad_3100g: 'C',
        termohigrometro: 'NA',
        herramientas_de_tapado_greiff: 'NA',
    },
    status: 'Conforme',
};
