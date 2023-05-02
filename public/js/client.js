const publicVapidKey =
  "BOzs1nqycOjCfUzkZ9a3eUHhLTR9bZYbptPED1o_P-XhiN48KcuHR2BhFCJ2zA4Vz0yBsUL_XfxA0cZyI2aB3DQ";

async function registerServiceWorker() {
  const register = await navigator.serviceWorker.register("../worker.js", {
    scope: "/",
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
    },
  });
}

registerServiceWorker();
