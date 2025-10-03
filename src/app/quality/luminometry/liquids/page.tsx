
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '../../../quality/client-page';
import { type QualityData } from '../../../quality/types';
import { type ProductionData } from '../../../production/page';

export const revalidate = 0;

export default async function LuminometryLiquidsPage() {
    const qualityData = await getAll<QualityData>('quality_luminometry_liquids');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Luminometría para Líquidos"
        pageDescription="Medición cuantitativa de la limpieza para producción de líquidos."
        formType="luminometry-liquids"
        collectionName='quality_luminometry_liquids'
        productionData={productionData}
        luminometryType="liquids"
     />;
}

    