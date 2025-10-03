
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function SensoryPage() {
    const qualityData = await getAll<QualityData>('quality_sensory');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Análisis Sensorial"
        pageDescription="Evaluación de productos según su olor, color y apariencia."
        formType="sensory"
        collectionName='quality_sensory'
        productionData={productionData}
     />;
}
