import { inngest } from "./client"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendExpirationEmail } from "@/lib/resend/emails"

/**
 * Job de background do Inngest para expirar reservas pendentes.
 * Ao receber o evento 'booking.created', aguarda 15 minutos e executa
 * a verificação. Se o status continuar 'pending', cancela a reserva.
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

    // 3. Se foi cancelado por expiração, envia o e-mail
    if (wasExpired) {
      await step.run("send-expiration-email", async () => {
        const supabase = createAdminClient()
        
        const { data: booking, error } = await supabase
          .from("bookings")
          .select("*, field:fields(*), customer:customers(*)")
          .eq("id", bookingId)
          .single()

        if (error || !booking) {
          console.error(`Erro ao buscar reserva ${bookingId} para enviar e-mail de expiração:`, error)
          return
        }

        await sendExpirationEmail(booking)
      })
    }
  }
)
