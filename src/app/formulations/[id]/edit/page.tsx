
import FormulationsFormPage from '../../form-page';

export const revalidate = 0;

export default function EditFormulationPage({ params }: { params: { id: string } }) {
    return <FormulationsFormPage formulationId={params.id} />
}
