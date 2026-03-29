import OneSignal from "react-onesignal";

let initialized = false;

export async function initOneSignal() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId) {
    console.warn("VITE_ONESIGNAL_APP_ID não configurado.");
    return;
  }

  await OneSignal.init({
    appId,
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
    serviceWorkerParam: {
      scope: "/push/onesignal/",
    },
    notifyButton: {
      enable: false,
    },
  });

  initialized = true;
}

export async function vincularClienteOneSignal(externalId) {
  if (!externalId) return;

  try {
    await initOneSignal();
    await OneSignal.login(String(externalId));
  } catch (error) {
    console.error("Erro ao vincular cliente no OneSignal:", error);
  }
}

export async function pedirPermissaoPush() {
  try {
    await initOneSignal();

    const jaTemPermissao = OneSignal.Notifications.permission;

    if (jaTemPermissao) return true;

    await OneSignal.Notifications.requestPermission();
    return OneSignal.Notifications.permission;
  } catch (error) {
    console.error("Erro ao pedir permissão push:", error);
    return false;
  }
}