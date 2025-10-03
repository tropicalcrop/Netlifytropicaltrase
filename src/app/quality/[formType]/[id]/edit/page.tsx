
import { type QualityFormType } from '../../../types';
import QualityFormPage from '../../../form-client';

export const revalidate = 0;

export default function EditQualityPage({ params }: { params: { id: string, formType: string } }) {
    return <QualityFormPage formType={params.formType as QualityFormType} logId={params.id} />;
}
