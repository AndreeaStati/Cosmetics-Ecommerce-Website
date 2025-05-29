const mysql = require('mysql');
const dbConfig = {
    host:'localhost',
    user:'root',
    password:'BazeDeDate1234@',
    multipleStatements: true
};

const session = require('express-session');
const cookieParser = require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const fs = require('fs/promises');

const app = express(); // <-- aceasta trebuie să fie aici sus, înainte de orice "app.use()"

app.use(cookieParser());

const ipAttempts = {}; 

const BLOCK_THRESHOLD = 3; // nr incercari gresite permise
const BLOCK_DURATION = 5 * 60 * 1000; // 5 min in ms

app.use((req, res, next) => {
    const ip = req.ip;

    const info = ipAttempts[ip];
    if (info && info.blockedUntil && Date.now() < info.blockedUntil) {
        return res.status(403).send("Acces blocat temporar din cauza mai multor accesări greșite.");
    }

    next();
});


app.use(session({
    secret: 'secretSession',
    resave: false,
    saveUninitialized: false,
    cookie: {} 
}));

app.use((req, res, next) => {
    res.locals.utilizator = req.session.utilizator;
    next();
});


const port = 6789;
// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');

// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views / layout.ejs
app.use(expressLayouts);

// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))

// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());

// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna pagina index.ejs
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => {
    const utilizator = req.session.utilizator;
    const ip = req.ip;

    if (ipAttempts[ip]) {
        delete ipAttempts[ip];
    }

    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    conn.query('SELECT * FROM produse', (err, rezultate) => {
    if (err) {
        console.warn("Tabela produse nu există încă sau altă eroare:", err.sqlMessage || err);
        conn.end();
        
        // Trimite pagina index fara produse
        return res.render('index', { produse: [], utilizator, session: req.session });
    }
    conn.end();
    res.render('index', { produse: rezultate, utilizator, session: req.session });
});

});


// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', async (req, res) => {
    try {
        const data = await fs.readFile('intrebari.json', 'utf-8');
        const listaIntrebari = JSON.parse(data);
        res.render('chestionar', { intrebari: listaIntrebari });
    } catch (error) {
        console.error('Eroare la citirea fișierului JSON:', error);
        res.status(500).send('Eroare la încărcarea chestionarului.');
    }
});


app.post('/rezultat-chestionar', async (req, res) => {
    try {
        const data = await fs.readFile('intrebari.json', 'utf-8');
        const listaIntrebari = JSON.parse(data);
        const raspunsuriUser = req.body;

        let punctaj = 0;

        listaIntrebari.forEach((intrebare, index) => {
            const raspunsCorect = intrebare.corect;
            const raspunsUser = parseInt(raspunsuriUser[`intrebare${index}`]);
            if (raspunsUser === raspunsCorect) {
                punctaj++;
            }
        });

        res.render('rezultat-chestionar', {
            total: listaIntrebari.length,
            corecte: punctaj
        });
    } catch (error) {
        console.error('Eroare la evaluarea răspunsurilor:', error);
        res.status(500).send('Eroare la procesarea răspunsurilor.');
    }
});

app.get('/autentificare', (req, res) => {
    const mesajEroare = req.session.mesajEroare;
    req.session.mesajEroare = null;
    res.render('autentificare', { mesajEroare });
});


app.post('/verificare-autentificare', async (req, res) => {
    const { username, pass } = req.body;

    try {
        const data = await fs.readFile('utilizatori.json', 'utf-8');
        const utilizatori = JSON.parse(data);
        const user = utilizatori.find(u => u.username === username && u.parola === pass);

        if (user) {
            req.session.utilizator = {
                username: user.username,
                nume: user.nume,
                prenume: user.prenume,
                rol: user.rol // adăugat
            };
            res.redirect('/');
        } else {
            req.session.mesajEroare = 'Utilizator sau parolă greșite.';
            res.redirect('/autentificare');
        }
    } catch (err) {
        console.error("Eroare la citirea fișierului utilizatori.json:", err);
        res.status(500).send('Eroare server.');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Eroare la delogare');
        }
        res.redirect('/');
    });
});


app.get('/creare-bd', (req, res) => {
    console.log("Ruta /creare-bd a fost accesată");
    const conn = mysql.createConnection(dbConfig);

    const query = `
        CREATE DATABASE IF NOT EXISTS cumparaturi;
        USE cumparaturi;
         CREATE TABLE IF NOT EXISTS produse (
            id INT PRIMARY KEY AUTO_INCREMENT,
            categorie VARCHAR(50),
            nume VARCHAR(150),
            pret DECIMAL(10,2),
            stoc INT,
            imagine VARCHAR(255)
        );
    `;

    conn.query(query, (err, results) => {
        if (err) {
            console.error("Eroare la creare Baza de Date: ", err.sqlMessage || err);
            return res.status(500).send("Eroare la creare Baza de Date");
        }
        conn.end();
        res.redirect('/');
    });
});


app.get('/inserare-bd', (req, res) => {
    console.log("Ruta /inserare-bd a fost accesată");

    const connection = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    const produse = [
        ['skincare', 'Garnier, Apa micelara pentru ten sensibil, 700ml', 33.89, 40, 'garnier.jpg'],
        ['skincare', 'Anua, Spuma de curatare cu extract de heartleaf și quercetinol, 150 ml', 57.36, 19, 'anua.png'],
        ['skincare', 'Skin1004 Madagascar, Toner exfoliant delicat pentru piele sensibilă, 210 ml', 83.00, 22, 'skin1004.png'],
        ['skincare', 'Beauty of Joseon, Ser pentru stralucire cu Propolis si Niacinamide', 73.47, 64, 'ser.png'],
        ['skincare', 'Purito, Crema de fata cu Pantenol si extract de Bambus Coreean, 100 ml', 78.75, 29, 'purito.jpg'],
        ['skincare', 'Isntree, Crema hidratanta cu acid hialuronic', 57.00, 30, 'isntree.png'],

        ['haircare', 'K18, Sampon detoxifiant', 142.00, 43, 'k18.png'],
        ['haircare', 'Redken, Balsam intens revitalizant, fortifiant si optimizat pentru par colorat, 300 ml', 108.00, 38, 'redken.png'],
        ['haircare', 'Moroccanoil, Masca intens hidratanta, 250 ml', 225.00, 27, 'moroccanoil.jpg'],
        ['haircare', 'Gisou, Ulei de par infuzat cu miere, 20 ml', 110.00, 47, 'gisou.png'],
       
        ['makeup', 'Catrice, Fond de ten', 45.00, 15, 'catrice.png'],
        ['makeup', 'NYX, Concealer', 55.54, 70, 'concealer.png'],
        ['makeup', 'Rare Beauty, Blush Lichid, 7.5 ml', 147.00, 25, 'blush.png'],
        ['makeup', 'Rare Beauty, Contur Lichid, 14.88 ml', 165.00, 34, 'bronzer.png'],
        ['makeup', 'Huda Beauty, Pudra libera de fixare', 209.00, 15, 'pudra.png'],
        ['makeup', 'NYX, Creion de buze Mauve  ', 30.00, 20, 'nyx.jpg'],
        ['makeup', 'Anastasia Beverly Hills, Ruj de buze, 3.5g', 148.00, 22, 'ruj.png'],
        ['makeup', 'Maybelline, Mascara Lash Sensational', 39.48, 50, 'maybelline.png']
    ];

    const query = 'INSERT INTO produse (categorie, nume, pret, stoc, imagine) VALUES ?';

    connection.query(query, [produse], (err, results) => {
        if (err) {
            console.error("Eroare la inserare produse:", err);
            return res.status(500).send("Eroare la inserare produse");
        }
        connection.end();
        res.redirect('/');
    });
});


app.post('/adaugare_cos', (req, res) => {
    const idProdus = parseInt(req.body.id);
    const cantitateSolicitata = parseInt(req.body.cantitate || '1');

    if (!req.session.utilizator) {
        return res.status(403).send("Trebuie să fii autentificat pentru a adăuga în coș.");
    }

    if (!req.session.cos) {
        req.session.cos = [];
    }

    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    conn.query('SELECT * FROM produse WHERE id = ?', [idProdus], (err, rezultate) => {
        if (err || rezultate.length === 0) {
            conn.end();
            return res.status(500).send("Produsul nu există sau eroare la interogare.");
        }

        const produs = rezultate[0];
        const index = req.session.cos.findIndex(p => p.id === idProdus);
        const cantitateInCos = index !== -1 ? req.session.cos[index].cantitate : 0;
        const totalCantitate = cantitateInCos + cantitateSolicitata;

        if (cantitateSolicitata < 1 || totalCantitate > produs.stoc) {
            conn.end();
            return res.status(400).send(`Poți adăuga cel mult ${produs.stoc - cantitateInCos} unități.`);
        }

        // Actualizează coșul în sesiune
        if (index !== -1) {
            req.session.cos[index].cantitate = totalCantitate;
        } else {
            req.session.cos.push({ id: idProdus, cantitate: cantitateSolicitata });
        }

        // Scade stocul în baza de date
        const stocNou = produs.stoc - cantitateSolicitata;
        conn.query('UPDATE produse SET stoc = ? WHERE id = ?', [stocNou, idProdus], (updateErr) => {
            conn.end();
            if (updateErr) {
                console.error("Eroare la actualizarea stocului:", updateErr);
                return res.status(500).send("Eroare la actualizarea stocului.");
            }

            console.log(`Stoc actualizat pentru produsul ${idProdus}: ${stocNou} unități rămase.`);
            res.redirect('/');
        });
    });
});


app.get('/vizualizare-cos', (req, res) => {
    if (!req.session.utilizator) {
        return res.status(403).send("Trebuie să fii autentificat pentru a vedea coșul.");
    }

    const cos = req.session.cos || [];

    if (cos.length === 0) {
        return res.render('vizualizare-cos', { produse: [], cantitati: {} });
    }

    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    const ids = cos.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    const query = `SELECT * FROM produse WHERE id IN (${placeholders})`;

    conn.query(query, ids, (err, rezultate) => {
        conn.end();

        if (err) {
            console.error("Eroare la extragerea produselor din coș:", err);
            return res.status(500).send("Eroare la afișarea coșului.");
        }

        const cantitatiMap = Object.fromEntries(cos.map(p => [p.id, p.cantitate]));

        res.render('vizualizare-cos', {
            produse: rezultate,
            cantitati: cantitatiMap
        });
    });
});


app.get('/admin', (req, res) => {
    const utilizator = req.session.utilizator;

    if (!utilizator || utilizator.rol !== 'ADMIN') {
        return res.status(403).send("Acces interzis. Această pagină este doar pentru administratori.");
    }

    res.render('admin');
});

app.post('/admin/adauga-produs', (req, res) => {
    const utilizator = req.session.utilizator;

    if (!utilizator || utilizator.rol !== 'ADMIN') {
        return res.status(403).send("Acces interzis.");
    }

    const { categorie, nume, pret, stoc, imagine } = req.body;
    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    const query = 'INSERT INTO produse (categorie, nume, pret, stoc, imagine) VALUES (?, ?, ?, ?, ?)';

    const pretNumar = parseFloat(pret);
    const stocNumar = parseInt(stoc);
    const categoriiPermise = ['skincare', 'makeup', 'haircare'];

    if (!categoriiPermise.includes(categorie)) {
        return res.status(400).send("Categorie invalidă.");
    }

    conn.query(query, [categorie, nume.trim(), pretNumar, stocNumar, imagine || null], (err, result) => {        if (err) {
            console.error("Eroare la adăugarea produsului:", err);
            return res.status(500).send("Eroare la adăugare produs.");
        }
        conn.end();
        res.redirect('/');
    });
});

app.use((req, res, next) => {
    const ip = req.ip;

    if (!ipAttempts[ip]) {
        ipAttempts[ip] = { count: 1 };
    } else {
        ipAttempts[ip].count++;
    }

    if (ipAttempts[ip].count >= BLOCK_THRESHOLD) {
        ipAttempts[ip].blockedUntil = Date.now() + BLOCK_DURATION;
        console.warn(`IP ${ip} a fost blocat temporar pentru ${BLOCK_DURATION / 60000} minute.`);
    }

    res.status(404).send("Resursa nu există.");
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:${port}/`));

/* prevenire sql injection
    - interogari parametrizate (conn.query('SELECT * FROM produse WHERE id = ?', [idProdus]))
    - validare date de intrare
*/