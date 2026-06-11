import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { expireBookingFunction } from "@/inngest/bookings"

// Servir o endpoint HTTP do Inngest para escutar eventos e disparar funções
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    expireBookingFunction,
  ],
})
