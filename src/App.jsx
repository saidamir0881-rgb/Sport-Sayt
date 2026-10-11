import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Athletes from '@/pages/Athletes';
import AthleteDetail from '@/pages/AthleteDetail';
import Coaches from '@/pages/Coaches';
import CoachDetail from '@/pages/CoachDetail';
import Clubs from '@/pages/Clubs';
import ClubDetail from '@/pages/ClubDetail';
import Tryouts from '@/pages/Tryouts';
import TryoutDetail from '@/pages/TryoutDetail';
import Scholarships from '@/pages/Scholarships';
import ScholarshipDetail from '@/pages/ScholarshipDetail';
import Opportunities from '@/pages/Opportunities';
import Profile from '@/pages/Profile';
import PostListing from '@/pages/PostListing';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Providers>
      <ScrollToTop />
      <Navbar />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kirish" element={<Login />} />
          <Route path="/royxatdan-otish" element={<Register />} />
          <Route path="/sportchilar" element={<Athletes />} />
          <Route path="/sportchilar/:id" element={<AthleteDetail />} />
          <Route path="/murabbiylar" element={<Coaches />} />
          <Route path="/murabbiylar/:id" element={<CoachDetail />} />
          <Route path="/klublar" element={<Clubs />} />
          <Route path="/klublar/:id" element={<ClubDetail />} />
          <Route path="/saralashlar" element={<Tryouts />} />
          <Route path="/saralashlar/:id" element={<TryoutDetail />} />
          <Route path="/stipendiyalar" element={<Scholarships />} />
          <Route path="/stipendiyalar/:id" element={<ScholarshipDetail />} />
          <Route path="/imkoniyatlar" element={<Opportunities />} />
          <Route path="/profilim" element={<Profile />} />
          <Route path="/elon-joylash" element={<PostListing />} />
          <Route path="/bildirishnomalar" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </Providers>
  );
}
