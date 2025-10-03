
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditMagnetInspectionPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="magnet-inspection" logId={params.id} />;
}
