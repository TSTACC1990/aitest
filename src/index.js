const express = require('express');
const cors = require('cors');
const webhookRouter = require('./webhook');
const calendarRouter = require('./calendar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Servidor de agendamiento activo' });
});

// Rutas
app.use('/webhook', webhookRouter);
app.use('/calendar', calendarRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
