# Servidor de Agendamiento de Citas

Servidor backend que conecta Dasha.ai con Google Calendar.

## Variables de entorno requeridas en Render

Configura estas variables en el panel de Render (nunca en el código):

| Variable | Valor |
|---|---|
| `GOOGLE_PROJECT_ID` | `agendamiento-citas-497404` |
| `GOOGLE_PRIVATE_KEY_ID` | (de tu archivo JSON) |
| `GOOGLE_PRIVATE_KEY` | (de tu archivo JSON — incluye los saltos de línea) |
| `GOOGLE_CLIENT_EMAIL` | `servidor-agendamiento@agendamiento-citas-497404.iam.gserviceaccount.com` |
| `GOOGLE_CLIENT_ID` | `100648627711722530064` |
| `PORT` | `3000` |

## Endpoints

- `GET /` — Health check
- `POST /webhook` — Recibe datos de Dasha al terminar la llamada
- `GET /calendar/disponibilidad?fecha=YYYY-MM-DD&hora=HH:MM` — Consulta disponibilidad
