
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function WeighingPage() {
    const qualityData = await getAll<QualityData>('weighing');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Control de Pesaje"
        pageDescription="Registro de tiempos y pesos durante el proceso de fabricación."
        formType="weighing"
        collectionName='weighing'
        productionData={productionData}
     />;
}
