
import { getAll } from '@/services/firestoreService';
import { type UserData } from '@/types/users';
import UsersClientPage from './client-page';

export const revalidate = 0;

export default async function UsersPage() {
    const data = await getAll<UserData>('users');
    return <UsersClientPage initialData={data} />;
}
