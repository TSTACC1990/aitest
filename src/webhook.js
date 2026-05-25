const express = require('express');
const router = express.Router();
const { verificarDisponibilidad, agendarCita } = require('./calendar');

// POST /webhook — Dasha llama aquí al terminar la conversación
router.post('/', async (req, res) => {
  try {
    const { nombre, fecha, hora } = req.body;

    if (!nombre || !fecha || !hora) {
      return res.status(400).json({
        error: 'Faltan datos. Se requiere nombre, fecha y hora.'
      });
    }

    console.log(`Solicitud recibida: ${nombre} para el ${fecha} a las ${hora}`);

    // Verificar disponibilidad en Google Calendar
    const disponible = await verificarDisponibilidad(fecha, hora);

    if (!disponible) {
      return res.json({
        success: false,
        mensaje: `Lo sentimos, el horario ${fecha} a las ${hora} no está disponible.`
      });
    }

    // Agendar la cita
    const evento = await agendarCita(nombre, fecha, hora);

    return res.json({
      success: true,
      mensaje: `Cita agendada correctamente para ${nombre} el ${fecha} a las ${hora}.`,
      evento_id: evento.id
    });

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
