
import { type QualityFormType } from '../../../types';
import QualityFormPage from '../../../form-client';

export const revalidate = 0;

export default function EditAttributeReleasePage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType='attribute-release' logId={params.id} />;
}
