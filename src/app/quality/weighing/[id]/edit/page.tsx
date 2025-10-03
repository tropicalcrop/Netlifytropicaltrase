
import { type QualityFormType } from '../../../types';
import QualityFormPage from '../../../form-client';

export const revalidate = 0;

export default function EditWeighingPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType='weighing' logId={params.id} />;
}
