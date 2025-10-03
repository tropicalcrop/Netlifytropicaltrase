
import QualityFormPage from '@/app/quality/form-client';

export const revalidate = 0;

export default function EditUtensilsLiquidsPage({ params }: { params: { id: string } }) {
    return <QualityFormPage formType="utensils-liquids" logId={params.id} />;
}
