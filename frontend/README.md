# ZenLink Medical - Frontend

Frontend pentru platforma ZenLink Medical, construit cu React, TypeScript, Vite și Tailwind CSS.

## Structura Proiectului

```
frontend/
├── src/
│   ├── components/          # Componente reutilizabile
│   │   ├── DoctorCard.tsx  # Card individual pentru doctor
│   │   ├── DoctorsList.tsx # Listă de carduri cu doctori
│   │   └── FiltersBar.tsx  # Bară de căutare și filtre
│   ├── pages/
│   │   └── DoctorsPage.tsx # Pagina principală pentru listarea doctorilor
│   ├── types/
│   │   └── doctor.ts       # Tipuri TypeScript pentru Doctor
│   ├── App.tsx             # Componenta principală
│   ├── main.tsx            # Punctul de intrare
│   └── index.css           # Stiluri globale (Tailwind)
├── index.html
├── package.json
├── tailwind.config.js      # Configurație Tailwind
├── vite.config.ts          # Configurație Vite
└── tsconfig.json           # Configurație TypeScript
```

## Instalare și Rulare

### Instalare dependențe
```bash
npm install
```

### Rulare în modul dezvoltare
```bash
npm run dev
```

Aplicația va rula pe `http://localhost:5173` (sau alt port disponibil).

### Build pentru producție
```bash
npm run build
```

### Preview build-ul de producție
```bash
npm run preview
```

## Design

- **Culoare fundal**: `#0B0F2A` (zenlink-dark)
- **Culoare accent**: `#4A9FFF` (zenlink-blue)
- **Tema**: Dark mode cu carduri rotunjite și design modern

## Funcționalități

### Pagina Doctors
- ✅ Listare doctori cu carduri
- ✅ Căutare după nume
- ✅ Filtrare după locație
- ✅ Filtrare după specializare
- ✅ Buton "View Profile" pentru fiecare doctor
- ✅ Date mock (8 doctori de test)

## Integrare cu Backend (viitor)

Pentru a integra cu API-ul backend Spring Boot, va trebui să:

1. Creați un serviciu pentru apeluri API (ex: `src/services/api.ts`)
2. Înlocuiți mock data din `DoctorsPage.tsx` cu apeluri reale către `/api/doctors`
3. Adăugați gestionarea erorilor și loading states

Exemplu de structură pentru viitor:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:8080/api';

export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await fetch(`${API_BASE_URL}/doctors`);
  if (!response.ok) throw new Error('Failed to fetch doctors');
  return response.json();
};
```

## Tehnologii

- **React 18** - Bibliotecă UI
- **TypeScript** - Tipizare statică
- **Vite** - Build tool rapid
- **Tailwind CSS** - Framework CSS utility-first

