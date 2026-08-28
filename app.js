import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://avkuvffhlhwuqbaprwea.supabase.co/rest/v1/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2a3V2ZmZobGh3dXFiYXByd2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDM5ODIsImV4cCI6MjEwMzUxOTk4Mn0.WQiJ7ozw9IOYnFf4nqUwc-wpRQmZcvXX7icJUqLFLhU
'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test: prüfen, ob die Verbindung funktioniert
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Fehler bei der Verbindung:', error)
  } else {
    console.log('Verbindung erfolgreich! Session:', data.session)
  }
})
