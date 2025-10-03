
import { getAll } from '@/services/firestoreService';
import { type Formulation } from '@/app/formulations/client-page';
import PowderProductionFormPage from '../../form-client';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function EditPowderProductionPage({ params }: { params: { id: string } }) {
    const { id } = params;
    return <PowderProductionFormPage logId={id} />;
}
