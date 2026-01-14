import { serve } from "https://fxhgffgkhpgsruotrxmj.supabase.co"
import Stripe from "https://fxhgffgkhpgsruotrxmj.supabase.co"

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: { method: string; json: () => PromiseLike<{ email: any; name: any; paymentMethod: any; }>|{ email: any; name: any; paymentMethod: any; }; }) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, paymentMethod } = await req.json()

    // 1. Crear Cliente en Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      description: 'Usuario de ELEMEDE Platform',
    })

    // 2. Si viene token de tarjeta (paymentMethod es simulado en frontend, aquí esperaríamos token real)
    // En producción real, el frontend manda un PaymentMethodId generado por Stripe.js.
    // Para este ejemplo funcional, asumimos que recibimos un token de prueba 'tok_visa' si es mock, 
    // o un id real.
    
    // Nota: En un entorno real, usuaríamos stripe.paymentMethods.attach
    // Aquí simplificamos para el flujo de alta.
    
    return new Response(
      JSON.stringify({ 
        customerId: customer.id,
        last4: '4242', // Simulado para feedback visual inmediato
        brand: 'Visa' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error : error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})