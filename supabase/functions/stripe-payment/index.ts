import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, amount, description, currency } = await req.json()

    // Crear Intención de Pago
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // En céntimos
      currency: currency || 'eur',
      customer: customerId,
      description: description,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never' // Para pagos background sin interacción
      },
      confirm: true // Intentar cobrar inmediatamente
    })

    return new Response(
      JSON.stringify({ 
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        invoiceId: `INV-${Date.now()}` // Generamos ID de referencia para el sistema
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})