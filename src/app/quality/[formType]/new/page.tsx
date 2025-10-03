
import { type QualityFormType } from '../../types';
import QualityFormPage from '../../form-client';

export const revalidate = 0;

export default function NewQualityPage({ params }: { params: { formType: string } }) {
    return <QualityFormPage formType={params.formType as QualityFormType} />;
}
