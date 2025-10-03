
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditUtensilsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="utensils" logId={params.id} />;
}
