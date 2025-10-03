
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function UtensilsLiquidsPage() {
    const qualityData = await getAll<QualityData>('utensils_liquids');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección de Utensilios y Artículos"
        pageDescription="Chequeo de utensilios y elementos que entran al proceso de líquidos."
        formType="utensils-liquids"
        collectionName='utensils_liquids'
     />;
}
