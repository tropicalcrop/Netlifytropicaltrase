
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditFinalBulkInspectionPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="final-bulk-inspection" logId={params.id} />;
}
