import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SMS_API_KEY   = Deno.env.get('SMS_PROVIDER_API_KEY')!
const SMS_API_URL   = 'https://notify.eskiz.uz/api/message/sms/send'
const CALL_API_URL  = 'https://api.playmobile.uz/v1/voice/send'   // mock endpoint

// ── Helpers ──────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

async function decrementLimit(tenantId: string, field: 'sms_limit_remaining' | 'call_limit_remaining') {
  await supabase.rpc('decrement_limit', { tenant: tenantId, col: field })
  // Fallback raw update if RPC not available:
  // const { data } = await supabase.from('barbershops').select(field).eq('id', tenantId).single()
  // await supabase.from('barbershops').update({ [field]: data[field] - 1 }).eq('id', tenantId)
}

// ── SMS ───────────────────────────────────────────────────────

async function sendSms(phone: string, message: string): Promise<boolean> {
  const res = await fetch(SMS_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SMS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mobile_phone: phone.replace(/\D/g, ''),
      message,
      from: '4546',
    }),
  })
  const body = await res.json().catch(() => ({}))
  console.log('[SMS]', res.status, JSON.stringify(body))
  return res.ok
}

// ── Call-Bot ──────────────────────────────────────────────────

async function scheduleCall(phone: string, customerName: string, startTime: string): Promise<boolean> {
  // Schedule the call 15 minutes before appointment
  const callAt = new Date(new Date(startTime).getTime() - 15 * 60_000).toISOString()

  const ttsText = `Assalomu alaykum ${customerName}! Siz 23 BRO BARBER saloniga navbat olgansiz. 15 daqiqadan so'ng sizni kutamiz.`

  const res = await fetch(CALL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SMS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: phone.replace(/\D/g, ''),
      scheduled_at: callAt,
      tts: ttsText,
      language: 'uz',
    }),
  })
  const body = await res.json().catch(() => ({}))
  console.log('[CALL]', res.status, JSON.stringify(body))
  return res.ok
}

// ── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Supabase DB Webhook sends { type, table, record, ... }
    const { record } = await req.json()

    const {
      tenant_id,
      customer_name,
      customer_phone,
      start_time,
    } = record as {
      tenant_id: string
      customer_name: string
      customer_phone: string
      start_time: string
      booking_source: string
    }

    // Fetch barbershop limits + location
    const { data: shop, error: shopErr } = await supabase
      .from('barbershops')
      .select('sms_limit_remaining, call_limit_remaining, location_link, name')
      .eq('id', tenant_id)
      .single()

    if (shopErr || !shop) {
      console.error('[SHOP]', shopErr?.message)
      return new Response('Barbershop not found', { status: 404 })
    }

    const results: Record<string, string> = {}

    // ── SMS ──────────────────────────────────────────────────
    if (shop.sms_limit_remaining > 0) {
      const message =
        `${shop.name}: Navbatingiz ${fmtTime(start_time)} da yozildi. ` +
        `Kechikmang! Lokatsiya: ${shop.location_link ?? 'mavjud emas'}`

      const sent = await sendSms(customer_phone, message)

      if (sent) {
        await decrementLimit(tenant_id, 'sms_limit_remaining')
        results.sms = 'sent'
        console.log(`[SMS] Sent to ${customer_phone}`)
      } else {
        results.sms = 'failed'
      }
    } else {
      results.sms = 'limit_exhausted'
      console.warn(`[SMS] Limit exhausted for tenant ${tenant_id}`)
    }

    // ── Call-Bot ─────────────────────────────────────────────
    if (shop.call_limit_remaining > 0) {
      const scheduled = await scheduleCall(customer_phone, customer_name, start_time)

      if (scheduled) {
        await decrementLimit(tenant_id, 'call_limit_remaining')
        results.call = 'scheduled'
        console.log(`[CALL] Scheduled for ${customer_phone} at -15min`)
      } else {
        results.call = 'failed'
      }
    } else {
      results.call = 'limit_exhausted'
      console.warn(`[CALL] Limit exhausted for tenant ${tenant_id}`)
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[UNHANDLED]', err)
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
