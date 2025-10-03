
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function PccFinalInspectionPage() {
    const qualityData = await getAll<QualityData>('quality_pcc_final_inspection');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección PCC (Final Fabricación)"
        pageDescription="Verificación de puntos críticos de control al finalizar la fabricación."
        formType="pcc-final-inspection"
        collectionName='quality_pcc_final_inspection'
        productionData={productionData}
     />;
}
