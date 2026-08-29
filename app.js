import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://avkuvffhlhwuqbaprwea.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3V2ZmZobGh3dXFiYXByd2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDM5ODIsImV4cCI6MjEwMzUxOTk4Mn0.WQiJ7ozw9IOYnFf4nqUwc-wpRQmZcvXX7icJUqLFLhU'
const supabase = createClient(supabaseUrl, supabaseKey)

// Merkt sich den aktuell aktiven Haushalt, damit wir ihn nicht ständig neu laden müssen
let aktuellerHaushalt = null

// HTML-Elemente
const authBereich = document.getElementById('auth-bereich')
const haushaltWaehlenBereich = document.getElementById('haushalt-waehlen-bereich')
const appBereich = document.getElementById('app-bereich')

const emailInput = document.getElementById('email')
const passwortInput = document.getElementById('passwort')
const authNachricht = document.getElementById('auth-nachricht')

const haushaltNachricht = document.getElementById('haushalt-nachricht')
const neuerHaushaltName = document.getElementById('neuer-haushalt-name')
const beitrittsCode = document.getElementById('beitritts-code')

const kategorieNachricht = document.getElementById('kategorie-nachricht')
const neueKategorieName = document.getElementById('neue-kategorie-name')
const neueKategorieTyp = document.getElementById('neue-kategorie-typ')
const kategorienListe = document.getElementById('kategorien-liste')

const transaktionNachricht = document.getElementById('transaktion-nachricht')
const neueTransaktionBetrag = document.getElementById('neue-transaktion-betrag')
const neueTransaktionKategorie = document.getElementById('neue-transaktion-kategorie')
const neueTransaktionDatum = document.getElementById('neue-transaktion-datum')
const neueTransaktionNotiz = document.getElementById('neue-transaktion-notiz')
const transaktionenListe = document.getElementById('transaktionen-liste')
const transaktionSumme = document.getElementById('transaktion-summe')

// --- Setze aktuelles Datum ---
neueTransaktionDatum.valueAsDate = new Date()

// --- Login/Registrierung ---

document.getElementById('btn-registrieren').addEventListener('click', async () => {
  const { error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwortInput.value
  })
  authNachricht.textContent = error ? 'Fehler: ' + error.message : 'Registrierung erfolgreich! Bitte anmelden.'
})

document.getElementById('btn-anmelden').addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwortInput.value
  })
  if (error) {
    authNachricht.textContent = 'Fehler: ' + error.message
  } else {
    pruefeHaushalt(data.user)
  }
})

document.getElementById('btn-abmelden').addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})
document.getElementById('btn-abmelden-2').addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// --- Haushalt erstellen ---

document.getElementById('btn-haushalt-erstellen').addEventListener('click', async () => {
  const name = neuerHaushaltName.value.trim()
  if (!name) {
    haushaltNachricht.textContent = 'Bitte einen Namen eingeben.'
    return
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data: haushalt, error: fehler1 } = await supabase
    .from('households')
    .insert({ name })
    .select()
    .single()

  if (fehler1) {
    haushaltNachricht.textContent = 'Fehler: ' + fehler1.message
    return
  }

  const { error: fehler2 } = await supabase
    .from('household_members')
    .insert({ household_id: haushalt.id, user_id: user.id })

  if (fehler2) {
    haushaltNachricht.textContent = 'Fehler: ' + fehler2.message
    return
  }

  zeigeAppBereich(user, haushalt)
})

// --- Haushalt beitreten ---

document.getElementById('btn-haushalt-beitreten').addEventListener('click', async () => {
  const haushaltId = beitrittsCode.value.trim()
  if (!haushaltId) {
    haushaltNachricht.textContent = 'Bitte eine Haushalts-ID eingeben.'
    return
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('household_members')
    .insert({ household_id: haushaltId, user_id: user.id })

  if (error) {
    haushaltNachricht.textContent = 'Fehler: ' + error.message
    return
  }

  const { data: haushalt } = await supabase
    .from('households')
    .select()
    .eq('id', haushaltId)
    .single()

  zeigeAppBereich(user, haushalt)
})

// --- Kategorien erstellen ---

document.getElementById('btn-kategorie-erstellen').addEventListener('click', async () => {
  const name = neueKategorieName.value.trim()
  const typ = neueKategorieTyp.value

  if (!name) {
    kategorieNachricht.textContent = 'Bitte einen Namen eingeben.'
    return
  }

  const { error } = await supabase
    .from('categories')
    .insert({
      household_id: aktuellerHaushalt.id,
      name: name,
      type: typ
    })

  if (error) {
    kategorieNachricht.textContent = 'Fehler: ' + error.message
    return
  }

  neueKategorieName.value = ''
  kategorieNachricht.textContent = ''
  ladeKategorien()
})

// --- Kategorien laden und anzeigen ---

async function ladeKategorien() {
  const { data: kategorien, error } = await supabase
    .from('categories')
    .select()
    .eq('household_id', aktuellerHaushalt.id)
    .order('name')

  if (error) {
    kategorieNachricht.textContent = 'Fehler beim Laden: ' + error.message
    return
  }

  kategorienListe.innerHTML = ''
  neueTransaktionKategorie.innerHTML = '<option value="">-- Kategorie wählen --</option>'

  kategorien.forEach(kategorie => {
    const typLabel = kategorie.type === 'income' ? 'Einnahme' : 'Ausgabe'

    const eintrag = document.createElement('li')
    eintrag.textContent = kategorie.name + ' (' + typLabel + ')'
    kategorienListe.appendChild(eintrag)

    const option = document.createElement('option')
    option.value = kategorie.id
    option.textContent = kategorie.name + ' (' + typLabel + ')'
    neueTransaktionKategorie.appendChild(option)
  })
}

async function ladeTransaktionen() {
  const { data: transaktionen, error } = await supabase
    .from('transactions')
    .select('*, categories(name, type)')
    .eq('household_id', aktuellerHaushalt.id)
    .order('transaction_date', { ascending: false })

  if (error) {
    transaktionNachricht.textContent = 'Fehler beim Laden: ' + error.message
    return
  }

  transaktionenListe.innerHTML = ''
  let summe = 0

  transaktionen.forEach(t => {
    const zeile = document.createElement('tr')

    const vorzeichen = t.categories?.type === 'income' ? 1 : -1
    summe += vorzeichen * parseFloat(t.amount)

    zeile.innerHTML =
      '<td>' + t.transaction_date + '</td>' +
      '<td>' + (t.categories?.name || '–') + '</td>' +
      '<td>' + parseFloat(t.amount).toFixed(2) + ' €</td>' +
      '<td>' + (t.description || '') + '</td>' +
      '<td>' +
        '<button class="btn-bearbeiten" data-id="' + t.id + '">Bearbeiten</button> ' +
        '<button class="btn-loeschen" data-id="' + t.id + '">Löschen</button>' +
      '</td>'

    transaktionenListe.appendChild(zeile)
  })

  transaktionSumme.textContent = 'Aktueller Saldo: ' + summe.toFixed(2) + ' €'

  // Klick-Handler für alle "Löschen"-Buttons
  document.querySelectorAll('.btn-loeschen').forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id
      const bestaetigt = confirm('Diese Transaktion wirklich löschen?')
      if (!bestaetigt) return

      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) {
        alert('Fehler beim Löschen: ' + error.message)
      } else {
        ladeTransaktionen()
      }
    })
  })

  // Klick-Handler für alle "Bearbeiten"-Buttons
  document.querySelectorAll('.btn-bearbeiten').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id
      const transaktion = transaktionen.find(t => t.id === id)
      starteBearbeitung(transaktion)
    })
  })
}

// Füllt das Eingabeformular oben mit den Werten der gewählten Transaktion,
// statt eine neue zu erstellen, überschreiben wir die vorhandene beim Speichern.
let bearbeiteteTransaktionId = null

function starteBearbeitung(transaktion) {
  bearbeiteteTransaktionId = transaktion.id
  neueTransaktionBetrag.value = transaktion.amount
  neueTransaktionKategorie.value = transaktion.category_id
  neueTransaktionDatum.value = transaktion.transaction_date
  neueTransaktionNotiz.value = transaktion.description || ''

  document.getElementById('btn-transaktion-erstellen').textContent = 'Änderung speichern'
  transaktionNachricht.textContent = 'Du bearbeitest einen bestehenden Eintrag.'
}

// --- Ansichten wechseln ---

function zeigeHaushaltWaehlen(user) {
  authBereich.style.display = 'none'
  appBereich.style.display = 'none'
  haushaltWaehlenBereich.style.display = 'block'
  document.getElementById('nutzer-email-2').textContent = 'Angemeldet als: ' + user.email
}

function zeigeAppBereich(user, haushalt) {
  aktuellerHaushalt = haushalt

  authBereich.style.display = 'none'
  haushaltWaehlenBereich.style.display = 'none'
  appBereich.style.display = 'block'
  document.getElementById('nutzer-email').textContent = 'Angemeldet als: ' + user.email
  document.getElementById('haushalt-info').innerHTML =
    'Haushalt: <strong>' + haushalt.name + '</strong><br>' +
    'Haushalts-ID zum Teilen mit der Familie: <code>' + haushalt.id + '</code>'

  ladeKategorien().then(() => ladeTransaktionen())
}

// --- Prüfen, ob Nutzer schon einem Haushalt angehört ---

async function pruefeHaushalt(user) {
  const { data: mitgliedschaft } = await supabase
    .from('household_members')
    .select('household_id, households(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (mitgliedschaft && mitgliedschaft.households) {
    zeigeAppBereich(user, mitgliedschaft.households)
  } else {
    zeigeHaushaltWaehlen(user)
  }
}

// --- Event Listener ---

document.getElementById('btn-transaktion-erstellen').addEventListener('click', async () => {
  const betrag = parseFloat(neueTransaktionBetrag.value)
  const kategorieId = neueTransaktionKategorie.value
  const datum = neueTransaktionDatum.value
  const notiz = neueTransaktionNotiz.value.trim()

  if (!betrag || isNaN(betrag)) {
    transaktionNachricht.textContent = 'Bitte einen gültigen Betrag eingeben.'
    return
  }
  if (!kategorieId) {
    transaktionNachricht.textContent = 'Bitte eine Kategorie auswählen.'
    return
  }

  if (bearbeiteteTransaktionId) {
    // Bestehenden Eintrag aktualisieren
    const { error } = await supabase
      .from('transactions')
      .update({
        category_id: kategorieId,
        amount: betrag,
        description: notiz || null,
        transaction_date: datum
      })
      .eq('id', bearbeiteteTransaktionId)

    if (error) {
      transaktionNachricht.textContent = 'Fehler: ' + error.message
      return
    }

    bearbeiteteTransaktionId = null
    document.getElementById('btn-transaktion-erstellen').textContent = 'Eintragen'
  } else {
    // Neuen Eintrag anlegen
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('transactions')
      .insert({
        household_id: aktuellerHaushalt.id,
        category_id: kategorieId,
        user_id: user.id,
        amount: betrag,
        description: notiz || null,
        transaction_date: datum
      })

    if (error) {
      transaktionNachricht.textContent = 'Fehler: ' + error.message
      return
    }
  }

  neueTransaktionBetrag.value = ''
  neueTransaktionNotiz.value = ''
  transaktionNachricht.textContent = ''
  ladeTransaktionen()
})

// --- Beim Laden der Seite: Session prüfen ---

supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    pruefeHaushalt(data.session.user)
  }
})
