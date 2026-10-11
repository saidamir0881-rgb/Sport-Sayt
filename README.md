# TalentSport (backendsiz, admin panelsiz)

O'zbekiston yosh sportchilari, murabbiylar va sport klublarini bog'laydigan platforma.
Bu versiya **faqat frontend**: React 18, Vite, React Router, Tailwind CSS. Server va ma'lumotlar bazasi kerak emas.

## Ishga tushirish
```bash
npm install
npm run dev        # http://localhost:5173
```
Node.js 18 yoki undan yangi versiya kerak.

## Ma'lumotlar qayerda saqlanadi
Barcha ma'lumotlar (foydalanuvchilar, profillar, e'lonlar, arizalar, bildirishnomalar) brauzerning `localStorage` xotirasida saqlanadi.

- Sahifa yangilansa ham ma'lumotlar saqlanib qoladi.
- Ma'lumotlar **faqat shu brauzerda** turadi: boshqa kompyuter yoki brauzerda ko'rinmaydi, foydalanuvchilar bir-biri bilan haqiqiy almashmaydi.
- Namuna (demo) ma'lumotlar birinchi ochilishda avtomatik yaratiladi va «Namuna (demo)» yorlig'i bilan ko'rsatiladi.
- Sayt pastidagi «Ma'lumotlarni boshidan tiklash» tugmasi hamma narsani o'chirib, boshlang'ich holatga qaytaradi.
- Parollar SHA-256 bilan xeshlanadi, lekin hammasi foydalanuvchi brauzerida turgani uchun bu **haqiqiy xavfsizlik emas**, faqat namoyish uchun.
- Rasmlar kichraytirilib (eng uzun tomoni 900 px) brauzer xotirasiga saqlanadi. Video yuklash bu rejimda yo'q.

## Rollar
- **Sportchi**: profil, yutuqlar, arizalar, takliflar, saqlanganlar, mos imkoniyatlar
- **Murabbiy**: profil, sportchilarni taklif qilish, saralash e'lonlari
- **Sport klubi**: klub profili, saralash va stipendiya e'lonlari, kelgan arizalarni qabul qilish yoki rad etish

Admin panel yo'q: klub va murabbiy profillari, e'lonlar darhol faol bo'ladi.

## Jonli namoyish uchun (bitta brauzerda)
1. Klub sifatida ro'yxatdan o'ting va saralash e'lonini joylang.
2. Chiqib, sportchi sifatida ro'yxatdan o'ting (boshqa email bilan). «Imkoniyatlar» sahifasida mos saralashni ko'rib ariza yuboring.
3. Chiqib, klub hisobiga qayta kiring: «Kelgan arizalar» bo'limida arizani qabul qiling.
4. Sportchi hisobiga qayta kiring: bildirishnoma va ariza holati yangilangan bo'ladi.

## Ma'lumotlar mantig'i qayerda
`src/lib/localApi.jsx`: avvalgi server API'sining brauzer ichidagi nusxasi (ro'yxatdan o'tish, filtrlar, arizalar, tavsiya algoritmi). Keyinchalik haqiqiy backendga qaytish uchun faqat `src/lib/api.jsx` faylini `fetch` ishlatadigan variantga almashtirish kifoya.

## Deploy
```bash
npm run build      # dist/ papkasi
```
`dist/` ni istalgan statik hostingga qo'ying. Hosting barcha manzillarni `index.html` ga yo'naltirishi kerak (SPA).
