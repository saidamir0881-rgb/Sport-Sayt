import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import { roleLabel } from '@/lib/format';
import RequireRole from '@/components/RequireRole';
import { PageHeader, Spinner } from '@/components/ui';
import AthleteDashboard from '@/components/dashboard/AthleteDashboard';
import CoachDashboard from '@/components/dashboard/CoachDashboard';
import ClubDashboard from '@/components/dashboard/ClubDashboard';

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get('tab') || 'profil';
  const setTab = (t) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  if (user.role === 'athlete') return <AthleteDashboard tab={tab} setTab={setTab} />;
  if (user.role === 'coach') return <CoachDashboard tab={tab} setTab={setTab} />;
  if (user.role === 'club') return <ClubDashboard tab={tab} setTab={setTab} />;
  return null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profilim" text={user ? `${user.name} (${roleLabel(user.role)})` : undefined} />
      <div className="container-x max-w-4xl py-8">
        <RequireRole>
          <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>}><Dashboard /></Suspense>
        </RequireRole>
      </div>
    </>
  );
}
