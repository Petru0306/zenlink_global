# Deploy Frontend to Vercel

## Opțiuni pentru a vedea frontend-ul:

### 1. **Development Local** (NU necesită Vercel)
Poți rula frontend-ul local și va funcționa cu backend-ul de pe Railway:

```bash
cd frontend
npm install
npm run dev
```

Apoi accesează `http://localhost:5173` în browser. Frontend-ul va comunica automat cu backend-ul de pe Railway.

### 2. **Production pe Vercel** (Recomandat pentru public)

#### Pasul 1: Creează cont pe Vercel
- Mergi la https://vercel.com
- Sign up cu GitHub (recomandat)

#### Pasul 2: Deploy Frontend
1. **Import Project:**
   - Click "Add New Project"
   - Selectează repository-ul tău `zenlink_global` de pe GitHub

2. **Configure Project:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` (sau lasă default)
   - **Output Directory:** `dist` (sau lasă default)
   - **Install Command:** `npm install` (sau lasă default)

3. **Environment Variables:**
   - Click "Environment Variables"
   - Adaugă:
     - **Key:** `VITE_BACKEND_URL`
     - **Value:** `https://zenlinkglobal-production-55f0.up.railway.app`
     - **Environment:** Production, Preview, Development (selectează toate)

4. **Deploy:**
   - Click "Deploy"
   - Așteaptă build-ul să se termine (1-2 minute)

#### Pasul 3: Accesează Site-ul
- După deploy, Vercel îți va da un URL (ex: `zenlink-global.vercel.app`)
- Site-ul tău va fi live și accesibil public!

## Verificare

După deploy, verifică:
1. Site-ul se încarcă corect
2. Poți face login/signup (testează cu backend-ul de pe Railway)
3. Toate request-urile merg către Railway backend

## Note Importante

- **CORS:** Backend-ul de pe Railway este deja configurat să accepte request-uri de la orice origin în producție
- **HTTPS:** Vercel oferă HTTPS automat
- **Custom Domain:** Poți adăuga un domeniu personalizat în Settings → Domains

## Alternative la Vercel

Dacă nu vrei Vercel, poți folosi:
- **Netlify** (similar cu Vercel)
- **Railway** (dar e mai complicat pentru frontend static)
- **GitHub Pages** (gratuit, dar mai limitat)
