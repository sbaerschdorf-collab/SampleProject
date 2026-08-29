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
  kategorien.forEach(kategorie => {
    const eintrag = document.createElement('li')
    const typLabel = kategorie.type === 'income' ? 'Einnahme' : 'Ausgabe'
    eintrag.textContent = kategorie.name + ' (' + typLabel + ')'
    kategorienListe.appendChild(eintrag)
  })
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

  ladeKategorien()
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

// --- Beim Laden der Seite: Session prüfen ---

supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    pruefeHaushalt(data.session.user)
  }
})
