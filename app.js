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
    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    conn.query('SELECT * FROM produse', (err, rezultate) => {
        if (err) {
            console.error("Eroare la interogare produse:", err);
            return res.status(500).send("Eroare la încărcare produse");
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
            nume VARCHAR(100),
            pret DECIMAL(10,2),
            stoc INT
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
        ['Isntree, Crema hidratanta cu acid hialuronic', 57.00, 30],
        ['K18, Sampon detoxifiant', 142.00, 43],
        ['NYX, Creion de buze Mauve  ', 30.00, 20],
        ['Catrice, Fond de ten', 45.00, 15],
        ['Garnier, Apa micelara pentru ten sensibil', 33.00, 40]
    ];

    const query = 'INSERT INTO produse (nume, pret, stoc) VALUES ?';

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

    if (!req.session.utilizator) {
        return res.status(403).send("Trebuie să fii autentificat pentru a adăuga în coș.");
    }

    if (!req.session.cos) {
        req.session.cos = [];
    }

    if (!req.session.cos.includes(idProdus)) {
        req.session.cos.push(idProdus);
    }

    console.log("Coșul actual:", req.session.cos);

    res.redirect('/');
});

app.get('/vizualizare-cos', (req, res) => {
    if (!req.session.utilizator) {
        return res.status(403).send("Trebuie să fii autentificat pentru a vedea coșul.");
    }

    const cos = req.session.cos || [];

    if (cos.length === 0) {
        return res.render('vizualizare-cos', { produse: [] });
    }

    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    const query = `SELECT * FROM produse WHERE id IN (${cos.map(() => '?').join(',')})`;

    conn.query(query, cos, (err, rezultate) => {
        if (err) {
            console.error("Eroare la extragerea produselor din coș:", err);
            return res.status(500).send("Eroare la afișarea coșului.");
        }
        conn.end();
        res.render('vizualizare-cos', { produse: rezultate });
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

    const { nume, pret, stoc } = req.body;
    const conn = mysql.createConnection({
        ...dbConfig,
        database: 'cumparaturi'
    });

    const query = 'INSERT INTO produse (nume, pret, stoc) VALUES (?, ?, ?)';

    conn.query(query, [nume, pret, stoc], (err, result) => {
        if (err) {
            console.error("Eroare la adăugarea produsului:", err);
            return res.status(500).send("Eroare la adăugare produs.");
        }
        conn.end();
        res.redirect('/');
    });
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost::${port}/`));