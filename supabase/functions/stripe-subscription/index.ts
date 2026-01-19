
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
    const { customerId, priceId } = await req.json()

    // Mapeo de IDs internos a IDs reales de Stripe
    const stripePriceMap: Record<string, string> = {
        'basic': 'price_basic_monthly_id',
        'basic_annual': 'price_basic_annual_id',
        'medium': 'price_medium_monthly_id',
        'medium_annual': 'price_medium_annual_id',
        'premium': 'price_premium_monthly_id',
        'premium_annual': 'price_premium_annual_id',
        'super_top': 'price_top_monthly_id',
        'super_top_annual': 'price_top_annual_id'
    };

    const finalPriceId = stripePriceMap[priceId] || priceId; // Fallback si envían ID directo o testing

    // Crear Suscripción
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: finalPriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    return new Response(
      JSON.stringify({ 
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
