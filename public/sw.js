// Service Worker para Web Push Notifications - Academia do Gol

self.addEventListener('install', (event) => {
  // Força ativação imediata do service worker
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {
    title: 'Academia do Gol',
    body: 'Nova atualização de reserva!',
    icon: '/logo.png',
    badge: '/logo.png',
    url: '/admin/reservas',
    tag: 'booking-notification',
  }

  try {
    if (event.data) {
      const payload = event.data.json()
      data = { ...data, ...payload }
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    tag: data.tag || 'academia-gol-' + Date.now(),
    data: {
      url: data.url || '/admin/reservas',
      dateOfArrival: Date.now(),
    },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Ver Reserva' },
      { action: 'close', title: 'Fechar' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const targetUrl = event.notification.data?.url || '/admin/reservas'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma janela aberta do admin, foca nela e redireciona
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Caso contrário, abre uma nova janela com a URL de destino
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
