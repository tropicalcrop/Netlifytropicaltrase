
import UserFormPage from '../../form-page';

export const revalidate = 0;

export default function EditUserPage({ params }: { params: { id: string } }) {
    return <UserFormPage userId={params.id} />;
}
