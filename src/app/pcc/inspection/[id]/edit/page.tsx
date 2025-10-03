
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditPccInspectionPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="pcc" logId={params.id} />;
}
