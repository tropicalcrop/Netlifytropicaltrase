

import { getAll } from '@/services/firestoreService';
import { type Formulation } from '@/app/formulations/client-page';
import LiquidProductionFormClientPage from '../../form-client';
import { type ProductionData } from '@/app/production/page';

export const revalidate = 0;

export default async function EditLiquidProductionPage({ params }: { params: { id: string } }) {
    const { id } = params;
    return <LiquidProductionFormClientPage logId={id} productItem={id}/>;
}
