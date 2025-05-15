const cookieParser = require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const fs = require('fs/promises');

const app = express();
app.use(cookieParser());

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
    const utilizator = req.cookies.utilizator;
    res.render('index', { utilizator });
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
    const mesajEroare = req.cookies.mesajEroare;
    res.clearCookie('mesajEroare');
    res.render('autentificare', { mesajEroare });
});


app.post('/verificare-autentificare', (req, res) => {
    const { username, pass } = req.body;

    if (username === 'aaa' && pass=== 'aaa123'){
        res.cookie('utilizator', username, {httpOnly: true});
        res.redirect('http://localhost:6789/');
    } else {
        res.cookie('mesajEroare', 'Utilizator sau parolă incorecte', { maxAge: 5000 });
        res.redirect('http://localhost:6789/autentificare');
    }
    
    console.log(req.body);
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:
:${port}/`));