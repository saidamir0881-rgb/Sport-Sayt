import CatalogPage from '@/components/CatalogPage';
import { CoachCard } from '@/components/cards';
import { REGIONS, SPORTS } from '@/lib/constants';

const cfg = {
  title: 'Murabbiylar',
  text: "Platformadagi murabbiylar. Sport turi va hudud bo'yicha qidiring.",
  path: '/coaches',
  fields: [
    { key: 'q', label: 'Ism bo\'yicha', placeholder: 'Murabbiy ismi' },
    { key: 'sport', label: 'Sport turi', type: 'select', options: SPORTS },
    { key: 'region', label: 'Hudud', type: 'select', options: REGIONS },
  ],
  render: (c) => <CoachCard key={c._id} c={c} />,
  emptyTitle: 'Murabbiylar topilmadi',
  emptyText: "Murabbiylar hali yo'q yoki filtrga mos kelmadi.",
};

export default function Page() { return <CatalogPage cfg={cfg} />; }
