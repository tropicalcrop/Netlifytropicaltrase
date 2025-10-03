
import { getAll } from '@/services/firestoreService';
import FormulationsClientPage, { type Formulation } from '../client-page';

export const revalidate = 0;

export default async function FormulationsPowdersPage() {
    const data = await getAll<Formulation>('formulations');
    // TODO: Filter for powder formulations
    return <FormulationsClientPage initialData={data} />;
}
