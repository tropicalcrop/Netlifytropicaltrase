
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function FinalBulkInspectionPage() {
    const qualityData = await getAll<QualityData>('quality_final_bulk_inspection');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección del Bulto Final"
        pageDescription="Inspección final del bulto (saldo)."
        formType="final-bulk-inspection"
        collectionName='quality_final_bulk_inspection'
        productionData={productionData}
     />;
}
