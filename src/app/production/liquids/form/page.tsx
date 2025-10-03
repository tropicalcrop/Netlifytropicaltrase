
import { getAll } from '@/services/firestoreService';
import { type Formulation } from '@/app/formulations/client-page';
import LiquidProductionFormClientPage from './client-page';

export const revalidate = 0;

export default async function NewLiquidProductionPage({ params }: { params: { id?: string } }) {
    const logId = params.id;
    const formulations = await getAll<Formulation>('formulations');
    
    return <LiquidProductionFormClientPage logId={logId} formulations={formulations} />;
}
