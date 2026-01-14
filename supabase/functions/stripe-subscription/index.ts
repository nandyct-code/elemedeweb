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

serve(async (req: { method: string; json: () => PromiseLike<{ customerId: any; priceId: any; }>|{ customerId: any; priceId: any; }; }) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerId, priceId } = await req.json()

    // Mapeo de IDs internos a IDs reales de Stripe (Estos deben existir en tu dashboard de Stripe)
    // Si no existen, usamos un precio genérico de prueba
    const stripePriceMap: Record<string, string> = {
        'basic': 'price_basic_monthly_id',
        'medium': 'price_medium_monthly_id',
        'premium': 'price_premium_monthly_id',
        'super_top': 'price_top_monthly_id'
    };

    const finalPriceId = stripePriceMap[priceId] || priceId; // Fallback si envían ID directo

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

  } catch (error) {
    return new Response(
      JSON.stringify({ error : error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})