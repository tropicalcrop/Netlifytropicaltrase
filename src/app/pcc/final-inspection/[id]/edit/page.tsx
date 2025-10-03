
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditPccFinalInspectionPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="pcc-final-inspection" logId={params.id} />;
}
