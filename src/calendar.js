const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const CALENDAR_ID = 'tstacc01011990@gmail.com';
const DURACION_MINUTOS = 60; // Duración de cada cita en minutos

// Configura autenticación con Google usando variables de entorno
function getAuth() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

// Verifica si un horario está disponible
async function verificarDisponibilidad(fecha, hora) {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  // Construye la fecha/hora de inicio y fin
  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + DURACION_MINUTOS * 60000);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: inicio.toISOString(),
      timeMax: fin.toISOString(),
      items: [{ id: CALENDAR_ID }],
    },
  });

  const ocupado = response.data.calendars[CALENDAR_ID].busy;
  return ocupado.length === 0; // true = disponible
}

// Crea un evento en Google Calendar
async function agendarCita(nombre, fecha, hora) {
  const auth = getAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const inicio = new Date(`${fecha}T${hora}:00`);
  const fin = new Date(inicio.getTime() + DURACION_MINUTOS * 60000);

  const evento = {
    summary: `Cita: ${nombre}`,
    description: `Cita agendada por el asistente de voz para ${nombre}`,
    start: { dateTime: inicio.toISOString(), timeZone: 'America/Lima' },
    end: { dateTime: fin.toISOString(), timeZone: 'America/Lima' },
  };

  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: evento,
  });

  return response.data;
}

// GET /calendar/disponibilidad?fecha=2024-12-01&hora=10:00
router.get('/disponibilidad', async (req, res) => {
  try {
    const { fecha, hora } = req.query;
    if (!fecha || !hora) {
      return res.status(400).json({ error: 'Se requiere fecha y hora' });
    }
    const disponible = await verificarDisponibilidad(fecha, hora);
    res.json({ disponible });
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    res.status(500).json({ error: 'Error al consultar el calendario' });
  }
});

module.exports = router;
module.exports.verificarDisponibilidad = verificarDisponibilidad;
module.exports.agendarCita = agendarCita;
