const express = require('express');
const router = express.Router();
const { verificarDisponibilidad, agendarCita } = require('./calendar');

// MCP over SSE — Dasha connects here
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send MCP capabilities on connect
  const capabilities = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'calendario-citas', version: '1.0.0' }
    }
  };
  res.write(`data: ${JSON.stringify(capabilities)}\n\n`);

  // Handle tool calls via POST on same base path
  req.on('close', () => res.end());
});

// MCP tool execution
router.post('/', async (req, res) => {
  const { method, params, id } = req.body;

  try {
    // List available tools
    if (method === 'tools/list') {
      return res.json({
        jsonrpc: '2.0', id,
        result: {
          tools: [
            {
              name: 'checkAvailability',
              description: 'Check if a date and time slot is available',
              inputSchema: {
                type: 'object',
                properties: {
                  fecha: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                  hora: { type: 'string', description: 'Time in HH:MM format' }
                },
                required: ['fecha', 'hora']
              }
            },
            {
              name: 'bookAppointment',
              description: 'Book an appointment for the client',
              inputSchema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string', description: 'Client full name' },
                  fecha: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                  hora: { type: 'string', description: 'Time in HH:MM format' }
                },
                required: ['nombre', 'fecha', 'hora']
              }
            }
          ]
        }
      });
    }

    // Execute a tool
    if (method === 'tools/call') {
      const { name, arguments: args } = params;

      if (name === 'checkAvailability') {
        const disponible = await verificarDisponibilidad(args.fecha, args.hora);
        return res.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: disponible
                ? `The slot on ${args.fecha} at ${args.hora} is available.`
                : `The slot on ${args.fecha} at ${args.hora} is not available.`
            }]
          }
        });
      }

      if (name === 'bookAppointment') {
        const evento = await agendarCita(args.nombre, args.fecha, args.hora);
        return res.json({
          jsonrpc: '2.0', id,
          result: {
            content: [{
              type: 'text',
              text: `Appointment confirmed for ${args.nombre} on ${args.fecha} at ${args.hora}. Event ID: ${evento.id}`
            }]
          }
        });
      }

      return res.status(404).json({
        jsonrpc: '2.0', id,
        error: { code: -32601, message: 'Tool not found' }
      });
    }

    // Initialize handshake
    if (method === 'initialize') {
      return res.json({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'calendario-citas', version: '1.0.0' }
        }
      });
    }

    res.json({ jsonrpc: '2.0', id, result: {} });

  } catch (error) {
    console.error('MCP error:', error);
    res.status(500).json({
      jsonrpc: '2.0', id,
      error: { code: -32000, message: error.message }
    });
  }
});

module.exports = router;
