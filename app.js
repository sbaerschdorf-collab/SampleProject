import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://avkuvffhlhwuqbaprwea.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3V2ZmZobGh3dXFiYXByd2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDM5ODIsImV4cCI6MjEwMzUxOTk4Mn0.WQiJ7ozw9IOYnFf4nqUwc-wpRQmZcvXX7icJUqLFLhU'
const supabase = createClient(supabaseUrl, supabaseKey)

// HTML-Elemente holen
const authBereich = document.getElementById('auth-bereich')
const appBereich = document.getElementById('app-bereich')
const emailInput = document.getElementById('email')
const passwortInput = document.getElementById('passwort')
const authNachricht = document.getElementById('auth-nachricht')
const nutzerEmailAnzeige = document.getElementById('nutzer-email')

// Registrieren
document.getElementById('btn-registrieren').addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signUp({
    email: emailInput.value,
    password: passwortInput.value
  })

  if (error) {
    authNachricht.textContent = 'Fehler: ' + error.message
  } else {
    authNachricht.textContent = 'Registrierung erfolgreich! Bitte E-Mail bestätigen (falls aktiviert) und dann anmelden.'
  }
})

// Anmelden
document.getElementById('btn-anmelden').addEventListener('click', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwortInput.value
  })

  if (error) {
    authNachricht.textContent = 'Fehler: ' + error.message
  } else {
    zeigeAppBereich(data.user)
  }
})

// Abmelden
document.getElementById('btn-abmelden').addEventListener('click', async () => {
  await supabase.auth.signOut()
  location.reload()
})

// Hilfsfunktion: wechselt die Ansicht nach erfolgreichem Login
function zeigeAppBereich(user) {
  authBereich.style.display = 'none'
  appBereich.style.display = 'block'
  nutzerEmailAnzeige.textContent = 'Angemeldet als: ' + user.email
}

// Beim Laden der Seite prüfen: ist schon jemand eingeloggt? (z.B. nach Reload)
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    zeigeAppBereich(data.session.user)
  }
})
