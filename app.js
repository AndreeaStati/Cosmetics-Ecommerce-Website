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
    res.render('index');
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
                prenume: user.prenume
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



app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:
:${port}/`));