import { inngest } from "./client"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendExpirationEmail, sendAdminCancelledBookingEmail, sendAdminDailyDigestEmail, sendDailyClosingReportEmail } from "@/lib/resend/emails"

/**
 * Job de background do Inngest para expirar reservas pendentes.
 * Ao receber o evento 'booking.created', aguarda 15 minutos e executa
 * a verificação. Se o status continuar 'pending', cancela a reserva e notifica.
 */
export const expireBookingFunction = inngest.createFunction(
  { id: "expire-booking", triggers: [{ event: "booking.created" }] },
  async ({ event, step }) => {
    const { bookingId } = event.data

    // 1. Aguarda 15 minutos
    await step.sleep("wait-15-minutes", "15m")

    // 2. Executa a expiração de forma atômica usando a RPC SECURITY DEFINER
    const wasExpired = await step.run("expire-booking-in-db", async () => {
      const supabase = createAdminClient()
      
      const { data, error } = await supabase.rpc("expire_booking", {
        booking_id: bookingId,
      })

      if (error) {
        throw new Error(`Erro ao rodar RPC de expiração: ${error.message}`)
      }

      return !!data
    })

    // 3. Se foi cancelado por expiração, envia os e-mails (cliente + admin)
    if (wasExpired) {
      await step.run("send-expiration-notifications", async () => {
        const supabase = createAdminClient()
        
        const { data: booking, error } = await supabase
          .from("bookings")
          .select("*, field:fields(*), customer:customers(*)")
          .eq("id", bookingId)
          .single()

        if (error || !booking) {
          console.error(`Erro ao buscar reserva ${bookingId} para enviar e-mails de expiração:`, error)
          return
        }

        // Notifica o cliente por e-mail
        await sendExpirationEmail(booking)

        // Notifica o administrador por e-mail que o horário foi reaberto
        await sendAdminCancelledBookingEmail(booking, 'Expiração automática (não pagamento do sinal PIX em 15min)')

        // Notifica o administrador via Web Push no celular/PC
        try {
          const { sendBookingCancelledPush } = await import('@/lib/web-push/push')
          await sendBookingCancelledPush(booking, 'Expiração por falta de pagamento PIX')
        } catch (pushErr) {
          console.error('Erro ao enviar push de expiração:', pushErr)
        }
      })
    }
  }
)

/**
 * Job agendado (Cron) para envio do resumo diário dos jogos às 07:00 da manhã (Brasília)
 */
export const dailyDigestFunction = inngest.createFunction(
  { id: "daily-digest-email", triggers: [{ cron: "0 10 * * *" }] }, // 10:00 UTC = 07:00 BRT (UTC-3)
  async ({ step }) => {
    await step.run("send-daily-digest", async () => {
      const supabase = createAdminClient()
      
      // Data de hoje no fuso de Brasília (YYYY-MM-DD)
      const now = new Date()
      const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const year = brTime.getFullYear()
      const month = String(brTime.getMonth() + 1).padStart(2, '0')
      const day = String(brTime.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*, field:fields(name), customer:customers(name, phone, email)")
        .eq("date", todayStr)
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Erro ao buscar reservas para o resumo diário:", error)
        return
      }

      // 1. Envia e-mail de resumo matinal ao administrador
      await sendAdminDailyDigestEmail(bookings ?? [], todayStr)

      // 2. Envia notificação Web Push de resumo matinal ao administrador
      try {
        const { sendDailyDigestPush } = await import('@/lib/web-push/push')
        await sendDailyDigestPush(bookings ?? [], todayStr)
      } catch (pushErr) {
        console.error('Erro ao enviar push de resumo diário:', pushErr)
      }
    })
  }
)



/**
 * Job agendado (Cron) para envio do fechamento diário às 23:30 (Brasília) aos diretores
 */
export const dailyClosingFunction = inngest.createFunction(
  { id: "daily-closing-email", triggers: [{ cron: "30 2 * * *" }] }, // 02:30 UTC = 23:30 BRT (UTC-3)
  async ({ step }) => {
    await step.run("send-daily-closing-report", async () => {
      const supabase = createAdminClient()

      // Data de hoje no fuso de Brasília (YYYY-MM-DD)
      const now = new Date()
      const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
      const year = brTime.getFullYear()
      const month = String(brTime.getMonth() + 1).padStart(2, '0')
      const day = String(brTime.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*, field:fields(name), customer:customers(name, phone, email)")
        .eq("date", todayStr)
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Erro ao buscar reservas para o fechamento diário:", error)
        return
      }

      await sendDailyClosingReportEmail(bookings ?? [], todayStr, {
        closedBy: "Fechamento Noturno Automático",
        notes: "Fechamento consolidado das reservas do dia.",
      })
    })
  }
)
