import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface NotificationPayload {
  user_id: string
  title: string
  body: string
  type: 'new_order' | 'order_accepted' | 'order_rejected' | 'order_status_changed' | 'product_approved' | 'product_rejected' | 'admin_announcement' | 'general'
  data?: Record<string, unknown>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { user_id, title, body, type, data }: NotificationPayload = await req.json()

    // Validate required fields
    if (!user_id || !title || !body || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create in-app notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        body,
        type,
      })
      .select()
      .single()

    if (notifError) {
      console.error('Error creating notification:', notifError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (subError) {
      console.error('Error fetching subscriptions:', subError)
    }

    // Send push notifications
    if (subscriptions && subscriptions.length > 0 && vapidPublicKey && vapidPrivateKey) {
      const webpush = await import('https://esm.sh/web-push@3.6.6')
      
      webpush.setVapidDetails(
        'mailto:support@mandoubtaiba.sa',
        vapidPublicKey,
        vapidPrivateKey
      )

      const pushPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title,
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              data: {
                url: data?.url || '/vendor/notifications',
                notification_id: notification.id,
                type,
                ...data,
              },
              actions: [
                { action: 'view', title: 'عرض' },
                { action: 'dismiss', title: 'تجاهل' },
              ],
            })
          )
        } catch (pushError) {
          console.error('Push notification failed:', pushError)
          // If subscription is invalid, remove it
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
        }
      })

      await Promise.allSettled(pushPromises)
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})