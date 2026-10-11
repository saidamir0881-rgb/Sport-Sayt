import { useMemo } from 'react';
import { useLocation, useNavigate, useParams as useRouterParams, useSearchParams as useRouterSearchParams } from 'react-router-dom';

export const usePathname = () => useLocation().pathname;
export const useParams = () => useRouterParams();
export const useSearchParams = () => useRouterSearchParams()[0];
export function useRouter() {
  const navigate = useNavigate();
  return useMemo(() => ({
    push: (to) => navigate(to),
    replace: (to) => navigate(to, { replace: true }),
    back: () => navigate(-1),
  }), [navigate]);
}
