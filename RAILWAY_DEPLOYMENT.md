# Railway Deployment Guide

## Pasul 1: Adaugă PostgreSQL în Railway

1. În Railway dashboard, click pe proiectul tău
2. Click pe **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway va crea automat o bază de date și va seta variabila `DATABASE_URL`

## Pasul 2: Setează Variabilele de Mediu

În Railway dashboard, mergi la **"Variables"** și adaugă:

### Variabile OBLIGATORII:

1. **`OPENAI_API_KEY`**
   - Valoare: Cheia ta OpenAI API (ex: `sk-proj-...`)
   - Obține de la: https://platform.openai.com/api-keys

### Variabile OPTIONALE (dacă nu folosești DATABASE_URL):

2. **`DB_USERNAME`** (doar dacă nu folosești DATABASE_URL)
   - Valoare: `postgres` (sau username-ul tău)

3. **`DB_PASSWORD`** (doar dacă nu folosești DATABASE_URL)
   - Valoare: Parola bazei de date

### Variabile care se setează AUTOMAT de Railway:

- ✅ **`DATABASE_URL`** - Setat automat când adaugi PostgreSQL
- ✅ **`PORT`** - Setat automat de Railway

## Pasul 3: Configurează Build Settings

Railway va detecta automat că e un proiect Maven/Java și va rula:
- Build: `mvn clean package -DskipTests`
- Start: `java -jar target/zenlink-0.0.1-SNAPSHOT.jar`

## Pasul 4: Verifică Log-urile

După deploy, verifică log-urile în Railway pentru:
- ✅ Aplicația pornește fără erori
- ✅ Conectare la baza de date reușită
- ✅ Serverul pornește pe port-ul corect

## Probleme Comune

### Eroare: "Cannot connect to database"
**Soluție**: Verifică că ai adăugat PostgreSQL service în Railway și că `DATABASE_URL` este setat.

### Eroare: "Port already in use"
**Soluție**: Aplicația folosește automat variabila `PORT` de la Railway. Nu setezi manual.

### Eroare: "OPENAI_API_KEY not found"
**Soluție**: Adaugă variabila `OPENAI_API_KEY` în Railway Variables.

### Eroare: "Build failed"
**Soluție**: 
- Verifică că ai `pom.xml` în root
- Verifică că Java 17+ este disponibil (Railway detectează automat)
- Verifică log-urile de build pentru detalii

## Structura Proiectului

Railway va detecta automat:
- ✅ `pom.xml` → Maven project
- ✅ `railway.json` → Configurație custom (opțional)
- ✅ Java 17+ → Versiunea Java

## Notă Importantă

Aplicația folosește `spring.jpa.hibernate.ddl-auto=update`, deci tabelele se vor crea automat la primul start.
