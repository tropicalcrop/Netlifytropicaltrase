
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function ScalesLiquidsPage() {
    const qualityData = await getAll<QualityData>('scales-liquids');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Verificación de Básculas (Líquidos)"
        pageDescription="Registro de pruebas de excentricidad y repetitividad para equipos de pesaje de líquidos."
        formType="scales-liquids"
        collectionName='scales-liquids'
        productionData={productionData}
        subType="liquids"
     />;
}

    
