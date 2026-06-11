import { Resend } from 'resend'

// Inicializa o Resend se a API Key estiver configurada
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Remetente padrão. Resend gratuito exige onboarding@resend.dev para domínios não verificados
const EMAIL_SENDER = 'Academia do Gol <onboarding@resend.dev>'

/**
 * Envia o e-mail de confirmação após pagamento do sinal
 */
export async function sendConfirmationEmail(booking: any) {
  const customerEmail = booking.customer?.email
  if (!customerEmail) {
    console.log(`[Resend] E-mail não enviado: cliente ${booking.customer?.name || 'desconhecido'} não possui endereço de e-mail.`)
    return { success: false, error: 'Cliente sem e-mail' }
  }

  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Calcula horário de fim
  const [hh, mm] = booking.start_time.split(':').map(Number)
  const endMin = hh * 60 + mm + booking.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const subject = `✓ Reserva Confirmada - Academia do Gol`
  const html = `
    <div style="font-family: sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #10b981; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; tracking-wider: 0.05em;">
          Confirmada
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center;">Horário Reservado com Sucesso!</h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        Olá, <strong>${booking.customer?.name}</strong>. O pagamento do sinal foi compensado e sua vaga está garantida. Nos vemos em campo!
      </p>
      
      <div style="background-color: #18181b; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 15px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px; font-weight: 700;">Detalhes do Aluguel</h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 32px;">
            <td style="color: #71717a;">Campo:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.field?.name}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Data:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600; text-transform: capitalize;">${dateDisplay}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Horário:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.start_time.substring(0, 5)} às ${endTime}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Duração:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.duration_minutes} min</td>
          </tr>
          <tr style="height: 32px; border-top: 1px dashed #27272a;">
            <td style="color: #71717a; padding-top: 8px;">Preço Total:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600; padding-top: 8px;">R$ ${Number(booking.total_amount).toFixed(2)}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #10b981; font-weight: 600;">Sinal Pago (PIX):</td>
            <td style="text-align: right; color: #10b981; font-weight: 700;">R$ ${Number(booking.deposit_amount).toFixed(2)}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Restante no Balcão:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">R$ ${Number(booking.remaining_amount).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reserva/confirmacao/${booking.id}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
          Ver Comprovante
        </a>
      </div>

      <div style="background-color: #09090b; padding: 12px; border-radius: 12px; border: 1px dashed rgba(245, 158, 11, 0.2); margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #f59e0b; line-height: 1.4; text-align: center;">
          ⚠️ <strong>Importante:</strong> Chegue com 10 minutos de antecedência. Em caso de cancelamento, o aviso deve ser feito com no mínimo 24h de antecedência.
        </p>
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 40px; border-top: 1px solid #27272a; padding-top: 16px;">
        Academia do Gol Complexo Esportivo &copy; 2026. Todos os direitos reservados.
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL] CONFIRMAÇÃO DE RESERVA
=========================================
Para: ${customerEmail}
Assunto: ${subject}
Corpo (Resumo):
- Campo: ${booking.field?.name}
- Data: ${booking.date} (${booking.start_time} - ${endTime})
- Sinal Pago: R$ ${Number(booking.deposit_amount).toFixed(2)}
=========================================
`)
    return { success: true, mock: true }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: customerEmail,
      subject,
      html,
    })
    return { success: true, response }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail via Resend:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Envia o e-mail de expiração por falta de pagamento
 */
export async function sendExpirationEmail(booking: any) {
  const customerEmail = booking.customer?.email
  if (!customerEmail) {
    console.log(`[Resend] E-mail não enviado: cliente ${booking.customer?.name || 'desconhecido'} não possui endereço de e-mail.`)
    return { success: false, error: 'Cliente sem e-mail' }
  }

  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Calcula horário de fim
  const [hh, mm] = booking.start_time.split(':').map(Number)
  const endMin = hh * 60 + mm + booking.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const subject = `⏰ Reserva Expirada - Academia do Gol`
  const html = `
    <div style="font-family: sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; tracking-wider: 0.05em;">
          Expirada
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center;">Reserva Cancelada por Expiração</h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        Olá, <strong>${booking.customer?.name}</strong>. O tempo limite de 15 minutos para o pagamento do sinal PIX da sua reserva expirou. O slot de tempo foi liberado para outros clientes.
      </p>
      
      <div style="background-color: #18181b; padding: 20px; border-radius: 16px; margin: 24px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 15px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px; font-weight: 700;">Detalhes da Solicitação Expirada</h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 32px;">
            <td style="color: #71717a;">Campo:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.field?.name}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Data:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600; text-transform: capitalize;">${dateDisplay}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Horário:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.start_time.substring(0, 5)} às ${endTime}</td>
          </tr>
          <tr style="height: 32px;">
            <td style="color: #71717a;">Sinal Requerido:</td>
            <td style="text-align: right; color: #ef4444; font-weight: 700;">R$ ${Number(booking.deposit_amount).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="color: #a1a1aa; font-size: 13px; text-align: center; line-height: 1.5;">
        Se você ainda deseja jogar, faça uma nova reserva pelo nosso site escolhendo um horário disponível.
      </p>

      <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/campos" style="background-color: #27272a; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block; border: 1px solid #3f3f46;">
          Ver Quadras Disponíveis
        </a>
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 40px; border-top: 1px solid #27272a; padding-top: 16px;">
        Academia do Gol Complexo Esportivo &copy; 2026. Todos os direitos reservados.
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL] EXPIRAÇÃO DE RESERVA
=========================================
Para: ${customerEmail}
Assunto: ${subject}
Corpo (Resumo):
- Campo: ${booking.field?.name}
- Data: ${booking.date} (${booking.start_time} - ${endTime})
- Motivo: Não pagamento do sinal PIX em 15min.
=========================================
`)
    return { success: true, mock: true }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: customerEmail,
      subject,
      html,
    })
    return { success: true, response }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail de expiração via Resend:', error)
    return { success: false, error: error.message }
  }
}
