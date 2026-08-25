/**
 * Escriu les plantilles de correu del projecte.
 *
 *   node scripts/plantilles-correu.mjs
 *
 * Cal fer-ho perque la plantilla de sèrie de Supabase envia nomes un enllaç i
 * en angles, i l'app entra amb un codi de sis xifres. Sense aixo, el correu
 * arriba pero no serveix de res: diu "Sign in" i el formulari demana un numero.
 *
 * {{ .Token }} es el codi i {{ .ConfirmationURL }} l'enllaç; GoTrue omple els
 * dos. Es deixen tots dos a proposit: el codi es el cami principal perque
 * funciona encara que el correu s'obri en un altre navegador, i l'enllaç es la
 * sortida per a qui prefereix clicar.
 */
import { readFileSync } from 'node:fs'

const token = readFileSync('.supabase-token', 'utf8').trim()
const ref = process.env.SUPABASE_PROJECT_REF ?? 'vliyimrvoeblgpzoldiv'

/**
 * HTML de correu: taules i estils en linia.
 *
 * Els clients de correu no entenen ni flexbox ni fulls d'estil externs, i
 * Gmail arriba a esborrar les etiquetes <style>. Aixo no es una pagina web.
 */
function cos(titol, introduccio) {
  return `<!doctype html>
<html lang="ca">
  <body style="margin:0;padding:24px;background:#f3f1ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1c1a17;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #d9d4ca;border-radius:8px;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <p style="margin:0 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#625d55;">OrganizApp Garaje</p>
          <h1 style="margin:0;font-size:20px;line-height:1.3;">${titol}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.5;color:#625d55;">${introduccio}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px;">
          <div style="background:#f3f1ed;border:1px solid #d9d4ca;border-radius:8px;padding:18px;text-align:center;">
            <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:34px;font-weight:700;letter-spacing:.28em;color:#1c1a17;">{{ .Token }}</div>
          </div>
          <p style="margin:14px 0 0;font-size:13px;color:#625d55;">Caduca d'aquí a una hora i només es pot fer servir un cop.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 28px;">
          <p style="margin:0 0 10px;font-size:13px;color:#625d55;">O entra directament des d'aquest dispositiu:</p>
          <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#f2c400;color:#1c1a17;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:6px;">Entrar a OrganizApp</a>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#8a847a;">Si no has demanat entrar-hi, no facis res: sense el codi ningú pot accedir al vostre inventari.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

const configuracio = {
  mailer_subjects_magic_link: 'El teu codi per entrar: {{ .Token }}',
  mailer_templates_magic_link_content: cos(
    'El teu codi per entrar',
    'Escriu aquestes sis xifres a l’app per entrar al garatge de casa.',
  ),
  mailer_subjects_confirmation: 'Confirma el teu correu: {{ .Token }}',
  mailer_templates_confirmation_content: cos(
    'Confirma el teu correu',
    'Escriu aquestes sis xifres a l’app per acabar de crear el compte.',
  ),
  mailer_subjects_recovery: 'El teu codi per entrar: {{ .Token }}',
  mailer_templates_recovery_content: cos(
    'El teu codi per entrar',
    'Escriu aquestes sis xifres a l’app per entrar al garatge de casa.',
  ),
  mailer_subjects_invite: 'T’han convidat a OrganizApp Garaje',
  mailer_templates_invite_content: cos(
    'T’han convidat al garatge',
    'Escriu aquestes sis xifres a l’app per entrar-hi.',
  ),
}

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(configuracio),
})

if (!response.ok) {
  console.error(`ERROR ${response.status}`)
  console.error((await response.text()).slice(0, 800))
  process.exit(1)
}

const desat = await response.json()
for (const clau of Object.keys(configuracio)) {
  const valor = desat[clau]
  const be = clau.includes('templates')
    ? String(valor ?? '').includes('{{ .Token }}')
    : String(valor ?? '') === configuracio[clau]
  console.log(`${be ? '✓' : '✗'} ${clau}`)
}
