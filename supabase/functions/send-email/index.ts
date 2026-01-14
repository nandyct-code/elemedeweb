import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Resend API Key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
  }

  try {
    // Esta función puede ser llamada directamente o via Database Webhook
    // Si es webhook, el payload es diferente, aquí asumimos llamada directa del frontend o trigger simple
    const { record } = await req.json(); // Asumiendo estructura de Webhook de Supabase
    
    // Si no es webhook, intentamos leer body directo
    const payload = record ? {
        to: record.recipient,
        subject: record.subject_sent,
        html: `<p>${record.subject_sent}</p>` // Simplificado, usaríamos templates reales
    } : await req.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ELEMEDE <onboarding@resend.dev>', // Cambiar a tu dominio verificado
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})