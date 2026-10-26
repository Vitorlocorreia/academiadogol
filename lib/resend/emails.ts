import { Resend } from 'resend'

// Inicializa o Resend se a API Key estiver configurada
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Remetente padrão. Resend gratuito exige onboarding@resend.dev para domínios não verificados
const EMAIL_SENDER = process.env.RESEND_FROM_EMAIL || 'Academia do Gol <onboarding@resend.dev>'

/**
 * Obtém o e-mail do administrador configurado no ambiente, nas configurações do banco ou fallback
 */
export async function resolveAdminNotificationEmail(): Promise<string> {
  // 1. Variável de ambiente tem prioridade
  if (process.env.ADMIN_NOTIFICATION_EMAIL) {
    return process.env.ADMIN_NOTIFICATION_EMAIL
  }
  if (process.env.ADMIN_EMAIL) {
    return process.env.ADMIN_EMAIL
  }

  // 2. Busca do banco de dados (tabela settings)
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('settings')
      .select('admin_notification_email')
      .single()

    if (data?.admin_notification_email) {
      return data.admin_notification_email
    }
  } catch {
    // Ignora erro se Supabase não estiver acessível no momento
  }

  // 3. Fallback padrão
  return 'contato@academiadogol.com.br'
}

/**
 * 1. Envia o e-mail de confirmação ao CLIENTE após pagamento do sinal
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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); color: #10b981; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">
          Confirmada
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center; letter-spacing: -0.02em;">Horário Reservado com Sucesso!</h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        Olá, <strong>${booking.customer?.name}</strong>. O pagamento do sinal foi compensado e sua vaga está garantida. Nos vemos em campo!
      </p>
      
      <div style="background-color: #18181b; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 14px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Detalhes do Aluguel</h3>
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
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reserva/confirmacao/${booking.id}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block;">
          Ver Comprovante
        </a>
      </div>

      <div style="background-color: #09090b; padding: 12px; border-radius: 8px; border: 1px dashed rgba(245, 158, 11, 0.25); margin-top: 24px;">
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
[MOCK EMAIL CLIENTE] CONFIRMAÇÃO DE RESERVA
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
    console.error('[Resend] Erro ao enviar e-mail ao cliente:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 2. Envia e-mail instantâneo ao ADMINISTRADOR quando uma nova reserva for confirmada
 */
export async function sendAdminNewBookingEmail(booking: any) {
  const adminEmail = await resolveAdminNotificationEmail()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const [hh, mm] = (booking.start_time || '00:00').split(':').map(Number)
  const duration = booking.duration_minutes || 60
  const endMin = hh * 60 + mm + duration
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const phoneClean = (booking.customer?.phone || '').replace(/\D/g, '')
  const waUrl = phoneClean ? `https://wa.me/55${phoneClean}?text=${encodeURIComponent(`Olá ${booking.customer?.name}, confirmamos seu horário na Academia do Gol para ${booking.date} às ${booking.start_time?.slice(0, 5)}!`)}` : '#'

  const subject = `🚨 [Nova Reserva] ${booking.customer?.name || 'Cliente'} - ${booking.field?.name || 'Campo'} (${dateDisplay.split(',')[0]} às ${booking.start_time?.slice(0, 5)})`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">
          ⚡ Nova Reserva Confirmada (Sinal Pago)
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center; letter-spacing: -0.02em;">
        Nova Partida Agendada!
      </h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        O cliente <strong>${booking.customer?.name}</strong> acabou de pagar o sinal PIX de <strong>R$ ${Number(booking.deposit_amount).toFixed(2)}</strong>.
      </p>

      <!-- Detalhes do Horário -->
      <div style="background-color: #18181b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #10b981; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">
          ⚽ Dados do Jogo
        </h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 28px;">
            <td style="color: #71717a;">Quadra / Campo:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 700;">${booking.field?.name}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Data:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600; text-transform: capitalize;">${dateDisplay}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Horário:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 700;">${booking.start_time?.substring(0, 5)} às ${endTime} (${duration} min)</td>
          </tr>
        </table>
      </div>

      <!-- Dados do Cliente -->
      <div style="background-color: #18181b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #60a5fa; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">
          👤 Dados do Cliente
        </h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 28px;">
            <td style="color: #71717a;">Nome:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.customer?.name}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Telefone / WhatsApp:</td>
            <td style="text-align: right; color: #10b981; font-weight: 600;">
              ${phoneClean ? `<a href="${waUrl}" style="color: #10b981; text-decoration: underline;">${booking.customer?.phone} 💬</a>` : booking.customer?.phone || '—'}
            </td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">E-mail:</td>
            <td style="text-align: right; color: #a1a1aa;">${booking.customer?.email || 'Não informado'}</td>
          </tr>
        </table>
      </div>

      <!-- Financeiro -->
      <div style="background-color: #18181b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #f59e0b; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">
          💰 Resumo Financeiro
        </h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 28px;">
            <td style="color: #71717a;">Valor Total:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">R$ ${Number(booking.total_amount).toFixed(2)}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #10b981; font-weight: 600;">Sinal Pago (PIX):</td>
            <td style="text-align: right; color: #10b981; font-weight: 700;">✓ R$ ${Number(booking.deposit_amount).toFixed(2)}</td>
          </tr>
          <tr style="height: 28px; border-top: 1px dashed #27272a;">
            <td style="color: #f59e0b; font-weight: 700; padding-top: 6px;">Receber no Balcão:</td>
            <td style="text-align: right; color: #f59e0b; font-weight: 800; font-size: 15px; padding-top: 6px;">R$ ${Number(booking.remaining_amount).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Botões de Ação Rápida -->
      <div style="text-align: center; margin-top: 28px; margin-bottom: 12px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="${appUrl}/admin/reservas" style="background-color: #10b981; color: #ffffff; padding: 12px 20px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block;">
          Ver no Painel Admin
        </a>
        ${phoneClean ? `
        <a href="${waUrl}" style="background-color: #27272a; color: #fafafa; border: 1px solid #3f3f46; padding: 12px 20px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block;">
          Abrir WhatsApp do Cliente
        </a>` : ''}
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 36px; border-top: 1px solid #27272a; padding-top: 16px;">
        Notificação Automática do Sistema &bull; Academia do Gol
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL ADMIN] 🚨 NOVA RESERVA CONFIRMADA
=========================================
Para (Admin): ${adminEmail}
Assunto: ${subject}
- Cliente: ${booking.customer?.name} (${booking.customer?.phone})
- Campo: ${booking.field?.name}
- Data: ${booking.date} (${booking.start_time?.slice(0, 5)} - ${endTime})
- Sinal Pago: R$ ${Number(booking.deposit_amount).toFixed(2)}
- A Cobrar no Balcão: R$ ${Number(booking.remaining_amount).toFixed(2)}
=========================================
`)
    return { success: true, mock: true }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: adminEmail,
      subject,
      html,
    })
    return { success: true, response }
  } catch (error: any) {
    console.error('[Resend] Erro ao enviar alerta de nova reserva ao admin:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 3. Envia e-mail ao ADMINISTRADOR informando que uma reserva foi cancelada ou expirou
 */
export async function sendAdminCancelledBookingEmail(booking: any, reason?: string) {
  const adminEmail = await resolveAdminNotificationEmail()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const dateDisplay = new Date(booking.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const [hh, mm] = (booking.start_time || '00:00').split(':').map(Number)
  const duration = booking.duration_minutes || 60
  const endMin = hh * 60 + mm + duration
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const subject = `❌ [Horário Liberado] ${booking.field?.name || 'Campo'} - ${booking.date} às ${booking.start_time?.slice(0, 5)}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">
          ❌ Horário Liberado / Reserva Cancelada
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center; letter-spacing: -0.02em;">
        Horário Disponível na Grade
      </h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        A reserva para <strong>${booking.field?.name}</strong> foi cancelada e o slot de tempo foi liberado para novos clientes.
      </p>

      <div style="background-color: #18181b; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #ef4444; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em;">
          Detalhes do Horário Cancelado
        </h3>
        <table style="width: 100%; font-size: 14px; color: #d4d4d8; border-collapse: collapse;">
          <tr style="height: 28px;">
            <td style="color: #71717a;">Quadra / Campo:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 700;">${booking.field?.name}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Data:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600; text-transform: capitalize;">${dateDisplay}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Horário Liberado:</td>
            <td style="text-align: right; color: #ef4444; font-weight: 700;">${booking.start_time?.substring(0, 5)} às ${endTime}</td>
          </tr>
          <tr style="height: 28px;">
            <td style="color: #71717a;">Cliente:</td>
            <td style="text-align: right; color: #ffffff; font-weight: 600;">${booking.customer?.name || '—'} (${booking.customer?.phone || '—'})</td>
          </tr>
          <tr style="height: 28px; border-top: 1px dashed #27272a;">
            <td style="color: #71717a; padding-top: 6px;">Motivo:</td>
            <td style="text-align: right; color: #f59e0b; font-weight: 600; padding-top: 6px;">${reason || 'Cancelamento de agendamento'}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
        <a href="${appUrl}/admin/agenda?date=${booking.date}" style="background-color: #27272a; color: #ffffff; border: 1px solid #3f3f46; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block;">
          Ver Grade do Dia na Agenda
        </a>
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 36px; border-top: 1px solid #27272a; padding-top: 16px;">
        Notificação Automática do Sistema &bull; Academia do Gol
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL ADMIN] ❌ RESERVA CANCELADA / LIBERADA
=========================================
Para (Admin): ${adminEmail}
Assunto: ${subject}
- Campo: ${booking.field?.name}
- Data: ${booking.date} (${booking.start_time?.slice(0, 5)} - ${endTime})
- Motivo: ${reason || 'Cancelamento'}
- Cliente: ${booking.customer?.name} (${booking.customer?.phone})
=========================================
`)
    return { success: true, mock: true }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: adminEmail,
      subject,
      html,
    })
    return { success: true, response }
  } catch (error: any) {
    console.error('[Resend] Erro ao enviar alerta de cancelamento ao admin:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 4. Envia o e-mail de expiração ao CLIENTE
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

  const [hh, mm] = booking.start_time.split(':').map(Number)
  const endMin = hh * 60 + mm + booking.duration_minutes
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`

  const subject = `⏰ Reserva Expirada - Academia do Gol`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 8px 16px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
          Expirada
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 8px; text-align: center;">Reserva Cancelada por Expiração</h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; line-height: 1.5;">
        Olá, <strong>${booking.customer?.name}</strong>. O tempo limite de 15 minutos para o pagamento do sinal PIX da sua reserva expirou. O slot de tempo foi liberado para outros clientes.
      </p>
      
      <div style="background-color: #18181b; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 14px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #27272a; padding-bottom: 8px; font-weight: 700;">Detalhes da Solicitação Expirada</h3>
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

      <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/campos" style="background-color: #27272a; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; display: inline-block; border: 1px solid #3f3f46;">
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
[MOCK EMAIL CLIENTE] EXPIRAÇÃO DE RESERVA
=========================================
Para: ${customerEmail}
Assunto: ${subject}
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
    console.error('[Resend] Erro ao enviar e-mail de expiração ao cliente:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Lista oficial de diretores e administradores para recebimento de fechamentos e resumos diários
 */
export const DAILY_CLOSING_RECIPIENTS = [
  'willanekarlaa@gmail.com',
  'ricardoelihimas@hotmail.com',
  'franciscobrennand@hotmail.com',
]

/**
 * 5. Envia o Resumo Diário Matinal (Daily Digest) aos ADMINISTRADORES
 */
export async function sendAdminDailyDigestEmail(bookings: any[], dateStr: string) {
  const adminEmail = await resolveAdminNotificationEmail()
  const recipients = Array.from(new Set([adminEmail, ...DAILY_CLOSING_RECIPIENTS])).filter(Boolean)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const dateDisplay = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const totalDeposit = bookings.reduce((sum, b) => sum + Number(b.deposit_amount || 0), 0)
  const totalRemaining = bookings.reduce((sum, b) => sum + Number(b.remaining_amount || 0), 0)
  const totalExpected = bookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)

  const subject = `☀️ [Resumo do Dia] ${bookings.length} ${bookings.length === 1 ? 'partida agendada' : 'partidas agendadas'} para hoje (${dateDisplay.split(',')[0]})`

  // Linhas da tabela de jogos
  const rowsHtml = bookings.length === 0
    ? `<tr><td colspan="4" style="text-align: center; padding: 24px; color: #71717a;">Nenhuma partida agendada para hoje até o momento.</td></tr>`
    : bookings.map((b) => {
        const phoneClean = (b.customer?.phone || '').replace(/\D/g, '')
        const waUrl = phoneClean ? `https://wa.me/55${phoneClean}` : '#'
        return `
          <tr style="border-bottom: 1px solid #27272a; height: 44px;">
            <td style="padding: 8px 4px; font-weight: 700; color: #10b981;">${b.start_time?.slice(0, 5)}</td>
            <td style="padding: 8px 4px; color: #ffffff; font-weight: 600;">${b.field?.name || 'Campo'}</td>
            <td style="padding: 8px 4px; color: #d4d4d8;">
              ${b.customer?.name || '—'}
              ${phoneClean ? `<br/><a href="${waUrl}" style="color: #71717a; font-size: 11px; text-decoration: underline;">${b.customer?.phone}</a>` : ''}
            </td>
            <td style="padding: 8px 4px; text-align: right; color: #f59e0b; font-weight: 700;">
              R$ ${Number(b.remaining_amount || 0).toFixed(2)}
            </td>
          </tr>
        `
      }).join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">
          ☀️ Resumo Matinal dos Jogos
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 4px; text-align: center; letter-spacing: -0.02em;">
        Escala de Jogos de Hoje
      </h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; text-transform: capitalize;">
        ${dateDisplay}
      </p>

      <!-- Métricas / Cards Rápidos -->
      <div style="display: flex; gap: 8px; margin: 20px 0;">
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #71717a; font-size: 11px; text-transform: uppercase; font-weight: 700;">Jogos</div>
          <div style="color: #ffffff; font-size: 20px; font-weight: 900; margin-top: 4px;">${bookings.length}</div>
        </div>
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #10b981; font-size: 11px; text-transform: uppercase; font-weight: 700;">Sinais (PIX)</div>
          <div style="color: #10b981; font-size: 18px; font-weight: 900; margin-top: 4px;">R$ ${totalDeposit.toFixed(0)}</div>
        </div>
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #f59e0b; font-size: 11px; text-transform: uppercase; font-weight: 700;">No Balcão</div>
          <div style="color: #f59e0b; font-size: 18px; font-weight: 900; margin-top: 4px;">R$ ${totalRemaining.toFixed(0)}</div>
        </div>
      </div>

      <!-- Tabela da Grade -->
      <div style="background-color: #18181b; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; border-bottom: 1px solid #27272a; padding-bottom: 8px;">
          Grade de Partidas
        </h3>
        <table style="width: 100%; font-size: 13px; color: #d4d4d8; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #27272a; color: #71717a; text-align: left; font-size: 11px; text-transform: uppercase;">
              <th style="padding-bottom: 6px;">Hora</th>
              <th style="padding-bottom: 6px;">Campo</th>
              <th style="padding-bottom: 6px;">Cliente</th>
              <th style="padding-bottom: 6px; text-align: right;">A Cobrar</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Botão CTA -->
      <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
        <a href="${appUrl}/admin/agenda?date=${dateStr}" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block;">
          Abrir Agenda Completa no Painel
        </a>
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 36px; border-top: 1px solid #27272a; padding-top: 16px;">
        Resumo Automático Matinal &bull; Academia do Gol<br/>
        Destinatários: ${recipients.join(', ')}
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL ADMIN] ☀️ RESUMO DIÁRIO MATINAL
=========================================
Para: ${recipients.join(', ')}
Assunto: ${subject}
Total de Jogos: ${bookings.length}
Sinais Arrecadados: R$ ${totalDeposit.toFixed(2)}
A Receber no Balcão: R$ ${totalRemaining.toFixed(2)}
=========================================
`)
    return { success: true, mock: true, recipients }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: recipients,
      subject,
      html,
    })
    return { success: true, response, recipients }
  } catch (error: any) {
    console.error('[Resend] Erro ao enviar resumo diário ao admin:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 6. Envia o Relatório Oficial de Fechamento Diário Noturno aos Sócios e Administradores
 */
export async function sendDailyClosingReportEmail(
  bookings: any[],
  dateStr: string,
  extraData?: { closedBy?: string; notes?: string }
) {
  const adminEmail = await resolveAdminNotificationEmail()
  const recipients = Array.from(new Set([adminEmail, ...DAILY_CLOSING_RECIPIENTS])).filter(Boolean)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const dateDisplay = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const activeBookings = bookings.filter((b) => b.status !== 'cancelled')
  const completedBookings = activeBookings.filter((b) => b.status === 'completed' || b.status === 'confirmed')
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled')

  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0)
  const totalDeposit = activeBookings.reduce((sum, b) => {
    return sum + (b.deposit_status === 'paid' ? Number(b.deposit_amount || 0) : 0)
  }, 0)
  const totalRemainingCollected = activeBookings.reduce((sum, b) => {
    return sum + (b.remaining_status === 'paid' ? Number(b.remaining_amount || 0) : 0)
  }, 0)
  const totalCollected = totalDeposit + totalRemainingCollected
  const totalPending = totalRevenue - totalCollected

  const subject = `🌙 [Fechamento Diário] Relatório de Jogos & Caixa - ${dateDisplay.split(',')[0]} (R$ ${totalCollected.toFixed(2)})`

  const rowsHtml = bookings.length === 0
    ? `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #71717a;">Nenhuma partida agendada para este dia.</td></tr>`
    : bookings.map((b) => {
        const isCancelled = b.status === 'cancelled'
        const depositPaid = b.deposit_status === 'paid'
        const remainingPaid = b.remaining_status === 'paid'

        const statusBadge = isCancelled
          ? `<span style="background-color: #ef444420; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">CANCELADO</span>`
          : remainingPaid
          ? `<span style="background-color: #10b98120; color: #10b981; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">100% PAGO</span>`
          : depositPaid
          ? `<span style="background-color: #f59e0b20; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">SINAL PAGO</span>`
          : `<span style="background-color: #71717a20; color: #a1a1aa; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">PENDENTE</span>`

        return `
          <tr style="border-bottom: 1px solid #27272a; height: 44px; opacity: ${isCancelled ? 0.6 : 1};">
            <td style="padding: 8px 4px; font-weight: 700; color: #10b981;">${b.start_time?.slice(0, 5)}</td>
            <td style="padding: 8px 4px; color: #ffffff; font-weight: 600;">${b.field?.name || 'Campo'}</td>
            <td style="padding: 8px 4px; color: #d4d4d8;">${b.customer?.name || '—'}</td>
            <td style="padding: 8px 4px; text-align: center;">${statusBadge}</td>
            <td style="padding: 8px 4px; text-align: right; color: #ffffff; font-weight: 700;">
              R$ ${Number(b.total_amount || 0).toFixed(2)}
            </td>
          </tr>
        `
      }).join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; padding: 32px 16px; max-width: 640px; margin: 0 auto; border-radius: 16px; border: 1px solid #27272a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em;">
          🌙 Fechamento Diário de Caixa &amp; Jogos
        </span>
      </div>

      <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 4px; text-align: center; letter-spacing: -0.02em;">
        Relatório Oficial de Fechamento do Dia
      </h2>
      <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin-top: 0; text-transform: capitalize;">
        ${dateDisplay} ${extraData?.closedBy ? `&bull; Feito por: <strong>${extraData.closedBy}</strong>` : ''}
      </p>

      <!-- Aviso aos destinatários -->
      <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 10px 14px; margin: 16px 0; font-size: 12px; color: #a1a1aa;">
        <strong style="color: #ffffff;">Envio Automático aos Diretores:</strong><br/>
        <span style="font-family: monospace; font-size: 11px; color: #60a5fa;">${recipients.join(' &bull; ')}</span>
      </div>

      <!-- Métricas / Cards Rápidos -->
      <div style="display: flex; gap: 8px; margin: 20px 0;">
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #71717a; font-size: 10px; text-transform: uppercase; font-weight: 700;">Partidas Ativas</div>
          <div style="color: #ffffff; font-size: 20px; font-weight: 900; margin-top: 4px;">${activeBookings.length}</div>
          <div style="font-size: 10px; color: #71717a;">${cancelledBookings.length} canc.</div>
        </div>
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #10b981; font-size: 10px; text-transform: uppercase; font-weight: 700;">Arrecadado</div>
          <div style="color: #10b981; font-size: 20px; font-weight: 900; margin-top: 4px;">R$ ${totalCollected.toFixed(2)}</div>
          <div style="font-size: 10px; color: #10b981;">PIX + Balcão</div>
        </div>
        <div style="flex: 1; background-color: #18181b; border: 1px solid #27272a; padding: 12px; border-radius: 10px; text-align: center;">
          <div style="color: #f59e0b; font-size: 10px; text-transform: uppercase; font-weight: 700;">Pendente</div>
          <div style="color: #f59e0b; font-size: 20px; font-weight: 900; margin-top: 4px;">R$ ${totalPending.toFixed(2)}</div>
          <div style="font-size: 10px; color: #f59e0b;">A acertar</div>
        </div>
      </div>

      ${extraData?.notes ? `
      <div style="background-color: #18181b; border-left: 3px solid #10b981; padding: 10px 14px; margin: 16px 0; border-radius: 0 6px 6px 0; font-size: 12px; color: #d4d4d8;">
        <strong>Observações do Fechamento:</strong> ${extraData.notes}
      </div>` : ''}

      <!-- Tabela da Grade -->
      <div style="background-color: #18181b; padding: 16px; border-radius: 12px; margin: 20px 0; border: 1px solid #27272a;">
        <h3 style="color: #ffffff; font-size: 13px; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; border-bottom: 1px solid #27272a; padding-bottom: 8px;">
          Detalhamento de Reservas do Dia
        </h3>
        <table style="width: 100%; font-size: 12px; color: #d4d4d8; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #27272a; color: #71717a; text-align: left; font-size: 10px; text-transform: uppercase;">
              <th style="padding-bottom: 6px;">Hora</th>
              <th style="padding-bottom: 6px;">Campo</th>
              <th style="padding-bottom: 6px;">Cliente</th>
              <th style="padding-bottom: 6px; text-align: center;">Status</th>
              <th style="padding-bottom: 6px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Botão CTA -->
      <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
        <a href="${appUrl}/admin/financeiro" style="background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 13px; display: inline-block;">
          Ver Painel Financeiro Completo
        </a>
      </div>

      <p style="color: #71717a; font-size: 11px; text-align: center; margin-top: 36px; border-top: 1px solid #27272a; padding-top: 16px;">
        Fechamento Diário Automático &bull; Academia do Gol
      </p>
    </div>
  `

  if (!resend) {
    console.log(`
=========================================
[MOCK EMAIL ADMIN] 🌙 FECHAMENTO DIÁRIO DE CAIXA
=========================================
Para: ${recipients.join(', ')}
Assunto: ${subject}
Total de Partidas: ${bookings.length}
Arrecadado: R$ ${totalCollected.toFixed(2)}
Pendente: R$ ${totalPending.toFixed(2)}
=========================================
`)
    return { success: true, mock: true, recipients }
  }

  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER,
      to: recipients,
      subject,
      html,
    })
    return { success: true, response, recipients }
  } catch (error: any) {
    console.error('[Resend] Erro ao enviar fechamento diário por email:', error)
    return { success: false, error: error.message }
  }
}
