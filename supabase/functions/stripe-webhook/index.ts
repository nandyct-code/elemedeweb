
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

declare const Deno: any;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret!,
      undefined,
      cryptoProvider
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Manejo de Eventos Clave
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      // 1. Registrar Factura
      await supabase.from('invoices').insert({
        id: invoice.id,
        business_id: invoice.subscription_details?.metadata?.business_id, // Asumiendo metadatos
        total_amount: invoice.total / 100,
        status: 'paid',
        date: new Date(invoice.created * 1000).toISOString(),
        data: invoice
      });
      
      // 2. Renovar Estado del Negocio (si estaba suspendido)
      const customerId = invoice.customer;
      await supabase.from('businesses')
        .update({ status: 'active' })
        .eq('stripe_customer_id', customerId);
      break;

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      const sub = event.data.object;
      // Suspender negocio por impago o cancelación
      await supabase.from('businesses')
        .update({ status: 'suspended' })
        .eq('stripe_customer_id', sub.customer);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
})
