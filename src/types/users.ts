
export interface UserData {
    id?: string;
    name: string;
    email: string;
    role: 'Administrator' | 'Quality' | 'Production';
    documentType: 'CC' | 'CE' | 'TI' | 'PASS';
    documentNumber: string;
    avatarUrl?: string;
    uid?: string;
}
