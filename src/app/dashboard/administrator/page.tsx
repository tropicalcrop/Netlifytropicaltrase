
import { getAll } from '@/services/firestoreService';
import { type ProductionData } from '@/app/production/page';
import { type UserData } from '@/app/users/page';
import AdministratorDashboardClientPage from './client-page';
import { type QualityData } from '@/app/quality/types';

export const revalidate = 0;

export default async function AdministratorDashboard() {
  const users = await getAll<UserData>('users');
  const productionLots = await getAll<ProductionData>('production');
  
  const qualityModules = [
    { name: 'quality_luminometry', label: 'Calidad' },
    { name: 'quality_sensory', label: 'Calidad' },
    { name: 'quality_area_inspection', label: 'Calidad' },
    { name: 'quality_in_process', label: 'Calidad' },
    { name: 'quality_finished_product', label: 'Calidad' },
    { name: 'endowment', label: 'Dotación' },
    { name: 'pcc', label: 'PCC' },
    { name: 'scales', label: 'Calidad' },
    { name: 'utensils', label: 'PCC' },
    { name: 'hygiene', label: 'Higiene' }
  ];

  const qualityDocsPromises = qualityModules.map(module => 
    getAll<any>(module.name).then(docs => 
      docs.map(d => ({ ...d, module: module.label }))
    )
  );

  const allDocsArrays = await Promise.all(qualityDocsPromises);
  const allNotifications = allDocsArrays.flat();

  const totalQualityDocs = allNotifications.filter(n => n.module === 'Calidad').length;

  const qualityFailures = allNotifications.filter(n =>
    n.status === 'Falla' || n.status === 'No Conforme' || n.status === 'Retenido' || n.result === 'Rechazado'
  ).length;

  return (
    <AdministratorDashboardClientPage 
      initialUsers={users}
      initialProductionLots={productionLots}
      initialNotifications={allNotifications}
      totalQualityDocs={totalQualityDocs}
      qualityFailures={qualityFailures}
    />
  );
}
