# Cosmetics Ecommerce Website

Acest proiect a fost realizat ca parte a laboratorului de **Programare Web** la Universitatea Tehnică „Gheorghe Asachi” din Iași – Facultatea de Automatică și Calculatoare.

Tema: **Cosmetice**  
Proiectul simulează o aplicație web de tip e-commerce unde utilizatorii pot:
- Răspunde la un chestionar tematic
- Să se autentifice
- Să vizualizeze produse din baza de date
- Să adauge produse într-un coș de cumpărături
- Să vizualizeze conținutul coșului
- Să interacționeze cu o interfață adaptată nivelului de securitate

## 🧰 Tehnologii utilizate

- Node.js + Express.js
- EJS + express-ejs-layouts
- Body-parser
- Cookie-parser
- Express-session
- MySQL
- HTML/CSS/JavaScript


## 🔑 Funcționalități

### ✅ Chestionar tematic (Lab 10)
- Generare dinamică pe baza fișierului `intrebari.json`
- Calculare scor și afișare rezultat

### 👤 Autentificare utilizator (Lab 11)
- Formulare pentru login
- Setare cookie-uri de sesiune
- Afișare mesaj de bun venit

### 🛍️ Bază de date produse + coș (Lab 12)
- Creare și populare DB
- Vizualizare produse
- Adăugare produse în coș
- Vizualizare coș

### 🔐 Securizare (Lab 13)
- Diferențiere între roluri (USER vs ADMIN)
- Protejare resursă /admin
- Limitare acces după tentative eșuate
- Prevenire atacuri SQL injection (sau altele)

## 🔧 Instalare și rulare

1. Clonează repo-ul:
```bash
git clone https://github.com/AndreeaStati/Cosmetics-Ecommerce-Website.git
cd Cosmetics-Ecommerce-Website
```

2. Instalează pachetele:
```bash
npm install
```

3. Rulează aplicația:
```bash
nodemon app.js
```

4. Deschide în browser:
```bash
http://localhost:6789
```
