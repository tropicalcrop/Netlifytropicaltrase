
import { getAll } from '@/services/firestoreService';
import QualityGenericClientPage from '@/app/quality/client-page';
import { type QualityData } from '@/app/quality/types';
import { type UserData } from '@/app/users/page';

export const revalidate = 0;

export default async function EndowmentPage() {
    const qualityData = await getAll<QualityData>('endowment');
    const usersData = await getAll<UserData>('users');
    
    return <QualityGenericClientPage 
        initialData={qualityData} 
        pageTitle="Inspección de Operarios (EPP)"
        pageDescription="Verificación del uso correcto de Equipo de Protección Personal (EPP)."
        formType="endowment"
        collectionName='endowment'
        usersData={usersData}
     />;
}
