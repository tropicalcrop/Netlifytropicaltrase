
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditAreaClearanceLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="area-clearance-liquids" logId={params.id} />;
}
