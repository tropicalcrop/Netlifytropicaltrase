
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function PccLiquidsPage() {
    const qualityData = await getAll<QualityData>('pcc_liquids');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección PCC (Inicio Fabricación)"
        pageDescription="Verificación de filtro en la línea de producción de líquidos."
        formType="pcc_liquids"
        collectionName='pcc_liquids'
     />;
}
