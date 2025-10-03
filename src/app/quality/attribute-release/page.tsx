
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function AttributeReleasePage() {
    const qualityData = await getAll<QualityData>('quality_attribute_release');
    const productionData = await getAll<ProductionData>('production');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Liberación por Atributos"
        pageDescription="Verificación final de atributos de envasado, embalaje e identificación."
        formType="attribute-release"
        collectionName='quality_attribute_release'
        productionData={productionData}
     />;
}
