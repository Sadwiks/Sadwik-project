const publicVapidKey = "BOksX3cwyMRAid63ofmoLr3IuOOIJaj_tmQKyKG6OxwgcM7bt_XtA-CuFYvBSsmQp7YZEOr2MaedimHlWrmpmhg";


async function registerServiceWorker() {
    const register = await navigator.serviceWorker.register('../worker.js', {
        scope: '/'
    });

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey,
    });

    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "Content-Type": "application/json",
        }
    })
}


registerServiceWorker() 