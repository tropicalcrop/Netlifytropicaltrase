
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditAreaClearancePowdersPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="area-clearance-powders" logId={params.id} />;
}
