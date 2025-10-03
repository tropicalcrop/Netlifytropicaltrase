import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function AreaClearanceLiquidsPage() {
    const qualityData = await getAll<QualityData>('quality_area_clearance_liquids');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Despeje de Área para Líquidos"
        pageDescription="Verificación de limpieza e inspección de equipos antes de la producción de líquidos."
        formType="area-clearance-liquids"
        collectionName='quality_area_clearance_liquids'
     />;
}
