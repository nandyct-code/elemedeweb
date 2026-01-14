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
    // Leemos el body una sola vez
    const body = await req.json();
    
    // Determinamos si es un payload directo o viene de un Webhook de base de datos
    const payload = body.record ? {
        to: body.record.recipient,
        subject: body.record.subject_sent,
        html: `<p>${body.record.subject_sent}</p>` 
    } : {
        to: body.to,
        subject: body.subject,
        html: body.html
    };

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

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})