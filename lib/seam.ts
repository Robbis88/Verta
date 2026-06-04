import { Seam } from "seam";

/**
 * Seam-aggregator for smartlås. Ett API dekker Nuki, Igloohome, Salto m.fl.
 * Aktiveres når SEAM_API_KEY finnes; til da brukes dev-stub i smartlock-actions.
 */
export const seamEnabled = Boolean(process.env.SEAM_API_KEY);

let _seam: Seam | null = null;
function seam(): Seam {
  const apiKey = process.env.SEAM_API_KEY;
  if (!apiKey) {
    throw new Error("SEAM_API_KEY mangler — smartlås er ikke konfigurert.");
  }
  if (!_seam) _seam = new Seam({ apiKey });
  return _seam;
}

/**
 * Starter tilkobling: lager en Connect Webview som eieren logger inn på med
 * sin egen lås-konto (Nuki/Igloohome/Salto). Returnerer URL + webview-id.
 */
export async function createLockConnectWebview(redirectUrl: string) {
  const webview = await seam().connectWebviews.create({
    custom_redirect_url: redirectUrl,
    custom_redirect_failure_url: redirectUrl,
    provider_category: "stable",
    accepted_capabilities: ["lock"],
    automatically_manage_new_devices: true,
    wait_for_device_creation: true,
  });
  return { url: webview.url, connectWebviewId: webview.connect_webview_id };
}

/** Mapper Seam sin device_type til vårt korte leverandørnavn. */
function lockProvider(deviceType: string): string {
  if (deviceType.includes("nuki")) return "nuki";
  if (deviceType.includes("igloo")) return "igloohome";
  if (deviceType.includes("salto")) return "salto";
  if (deviceType.includes("august")) return "august";
  if (deviceType.includes("yale")) return "yale";
  return "seam";
}

/**
 * Henter resultatet av en Connect Webview: den tilkoblede låsen, eller null
 * hvis innloggingen ikke er fullført / ingen lås ble funnet ennå.
 */
export async function getConnectedLock(connectWebviewId: string) {
  const webview = await seam().connectWebviews.get({
    connect_webview_id: connectWebviewId,
  });
  if (!webview.login_successful || !webview.connected_account_id) return null;

  const devices = await seam().devices.list({
    connected_account_id: webview.connected_account_id,
  });
  const lock = devices[0];
  if (!lock) return null;

  return {
    connectedAccountId: webview.connected_account_id,
    deviceId: lock.device_id,
    provider: lockProvider(lock.device_type),
  };
}

/**
 * Lager en tidsbegrenset adgangskode for et opphold. Igloohome-låser kan bruke
 * offline-koder (algoPIN) som virker uten at låsen er på nett.
 */
export async function createBookingAccessCode(opts: {
  deviceId: string;
  name: string;
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  offline?: boolean;
}) {
  const code = opts.offline
    ? await seam().accessCodes.create({
        device_id: opts.deviceId,
        name: opts.name,
        starts_at: opts.startsAt,
        ends_at: opts.endsAt,
        is_offline_access_code: true,
      })
    : await seam().accessCodes.create({
        device_id: opts.deviceId,
        name: opts.name,
        starts_at: opts.startsAt,
        ends_at: opts.endsAt,
      });
  return { accessCodeId: code.access_code_id, code: code.code };
}

/** Fjerner en adgangskode (f.eks. ved avbestilling). */
export async function removeAccessCode(accessCodeId: string) {
  await seam().accessCodes.delete({ access_code_id: accessCodeId });
}
