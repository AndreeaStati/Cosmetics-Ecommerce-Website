const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')

const app = express();

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

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => res.send('Hello World'));

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
    const listaIntrebari = [
        {
            intrebare: 'Ce tip de ten are nevoie de produse non-comedogenice?',
            variante: ['Ten uscat', 'Ten normal', 'Ten gras', 'Ten sensibil'],
            corect: 2
        },
        {
            intrebare: 'Care ingredient este cunoscut pentru reducerea acneei?',
            variante: ['Acid hialuronic', 'Retinol', 'Ulei de cocos', 'Lanolină'],
            corect: 1
        },
        {
            intrebare: 'Ce produs se aplică primul în rutina de îngrijire?',
            variante: ['Cremă hidratantă', 'Serum', 'Toner', 'Curățare facială'],
            corect: 3
        },
        {
            intrebare: 'Ce SPF este recomandat pentru utilizare zilnică?',
            variante: ['SPF 10', 'SPF 15', 'SPF 30', 'SPF 50+'],
            corect: 3
        },
        {
            intrebare: 'Ce rol are acidul hialuronic în produse cosmetice?',
            variante: ['Exfoliere', 'Hidratare', 'Protecție solară', 'Colorare'],
            corect: 1
        },
        {
            intrebare: 'Ce înseamnă termenul “hipoalergenic”?',
            variante: ['Produs testat pe animale', 'Produs fără alcool', 'Produs ce reduce riscul de alergii', 'Produs natural'],
            corect: 2
        },
        {
            intrebare: 'Ce tip de produs este BB Cream?',
            variante: ['Fond de ten cu acoperire mare', 'Balsam pentru buze', 'Cremă cu beneficii multiple', 'Bază de machiaj'],
            corect: 2
        },
        {
            intrebare: 'Ce ingredient este recomandat pentru estomparea petelor pigmentare?',
            variante: ['Vitamina C', 'Colagen', 'Lanolină', 'Glicerină'],
            corect: 0
        },
        {
            intrebare: 'Cât de des ar trebui folosit un exfoliant chimic?',
            variante: ['Zilnic', 'O dată pe lună', 'De 2-3 ori pe săptămână', 'Niciodată'],
            corect: 2
        },
        {
            intrebare: 'Ce este “clean beauty”?',
            variante: ['Machiaj rezistent la apă', 'Produse testate clinic', 'Produse fără ingrediente controversate', 'Produse ieftine'],
            corect: 2
        }
    ];

    res.render('chestionar', { intrebari: listaIntrebari });
});


app.post('/rezultat-chestionar', (req, res) => {
    const raspunsuriCorecte = [2, 1, 3, 3, 1, 2, 2, 0, 2, 2]; // corespunde celor 10 întrebări
    const raspunsuriUser = req.body;

    let punctaj = 0;

    raspunsuriCorecte.forEach((corect, index) => {
        const raspunsUser = parseInt(raspunsuriUser[`intrebare${index}`]);
        if (raspunsUser === corect) {
            punctaj++;
        }
    });

    res.render('rezultat-chestionar', {
        total: raspunsuriCorecte.length,
        corecte: punctaj
    });
});


app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:
:${port}/`));