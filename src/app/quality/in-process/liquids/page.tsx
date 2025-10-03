import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function InProcessLiquidsPage() {
    const qualityData = await getAll<QualityData>('quality_in_process_liquids');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Muestreo y Control en Proceso"
        pageDescription="Control de calidad detallado para la producción de líquidos."
        formType="in-process-liquids"
        collectionName='quality_in_process_liquids'
        productionData={productionData}
     />;
}
