
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function InProcessPowdersPage() {
    const qualityData = await getAll<QualityData>('quality_in_process');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Muestreo y Control en Proceso (Polvos)"
        pageDescription="Revisión de estándares de producto durante el proceso de fabricación de polvos."
        formType="in-process"
        collectionName='quality_in_process'
        productionData={productionData}
     />;
}
