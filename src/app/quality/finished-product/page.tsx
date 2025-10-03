
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function FinishedProductPage() {
    const qualityData = await getAll<QualityData>('quality_finished_product');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Envasado y Empaque"
        pageDescription="Aprobación y registro de envasado."
        formType="finished-product"
        collectionName='quality_finished_product'
        productionData={productionData}
     />;
}
