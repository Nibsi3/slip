/**
 * Capacitor native bridge helpers.
 * All functions are safe to call on web (they no-op gracefully).
 * On Android they invoke the corresponding native plugin.
 */

// ─── Type-only guard ────────────────────────────────────────────────────────

export function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

// ─── Dynamic plugin loaders (tree-shake safe) ───────────────────────────────

async function getStatusBar() {
  const { StatusBar } = await import('@capacitor/status-bar');
  return StatusBar;
}

async function getSplashScreen() {
  const { SplashScreen } = await import('@capacitor/splash-screen');
  return SplashScreen;
}

async function getCamera() {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  return { Camera, CameraResultType, CameraSource };
}

async function getPushNotifications() {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
}

async function getBrowser() {
  const { Browser } = await import('@capacitor/browser');
  return Browser;
}

async function getNetwork() {
  const { Network } = await import('@capacitor/network');
  return Network;
}

async function getBarcodeScanner() {
  const mod = await import('@capacitor-mlkit/barcode-scanning');
  return { BarcodeScanner: mod.BarcodeScanner, BarcodeFormat: mod.BarcodeFormat };
}

// ─── Status bar ─────────────────────────────────────────────────────────────

export async function initStatusBar() {
  if (!isNative()) return;
  try {
    const StatusBar = await getStatusBar();
    const { Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#080808' });
    await StatusBar.show();
  } catch (e) {
    console.warn('[cap] StatusBar init failed', e);
  }
}

// ─── Splash screen ──────────────────────────────────────────────────────────

export async function hideSplash() {
  if (!isNative()) return;
  try {
    const SplashScreen = await getSplashScreen();
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (e) {
    console.warn('[cap] SplashScreen hide failed', e);
  }
}

// ─── In-app browser ─────────────────────────────────────────────────────────

export async function openInAppBrowser(url: string) {
  if (!isNative()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    const Browser = await getBrowser();
    await Browser.open({ url, presentationStyle: 'popover' });
  } catch (e) {
    console.warn('[cap] Browser open failed', e);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// ─── Network detection ──────────────────────────────────────────────────────

export async function getNetworkStatus(): Promise<boolean> {
  if (!isNative()) return navigator.onLine;
  try {
    const Network = await getNetwork();
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return true;
  }
}

export async function addNetworkListener(cb: (connected: boolean) => void) {
  if (!isNative()) {
    window.addEventListener('online', () => cb(true));
    window.addEventListener('offline', () => cb(false));
    return;
  }
  try {
    const Network = await getNetwork();
    await Network.addListener('networkStatusChange', (s) => cb(s.connected));
  } catch (e) {
    console.warn('[cap] Network listener failed', e);
  }
}

// ─── Camera (document / selfie capture) ─────────────────────────────────────

export interface CapturedPhoto {
  dataUrl: string;
  format: string;
}

export async function capturePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<CapturedPhoto | null> {
  if (!isNative()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await getCamera();
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      saveToGallery: false,
    });
    if (!photo.dataUrl) return null;
    return { dataUrl: photo.dataUrl, format: photo.format };
  } catch (e) {
    console.warn('[cap] Camera capture failed', e);
    return null;
  }
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

// ─── Push notifications ──────────────────────────────────────────────────────

export async function registerPushNotifications(
  onToken: (token: string) => void,
  onNotification: (title: string, body: string) => void,
): Promise<void> {
  if (!isNative()) return;
  try {
    const PushNotifications = await getPushNotifications();

    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('[cap] Push notification permission denied');
      return;
    }

    await PushNotifications.register();

    await PushNotifications.addListener('registration', (token) => {
      onToken(token.value);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[cap] Push registration error', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onNotification(notification.title || '', notification.body || '');
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = action.notification.data?.url as string | undefined;
      if (url) {
        window.location.href = url;
      }
    });
  } catch (e) {
    console.warn('[cap] Push notifications setup failed', e);
  }
}

// ─── QR / Barcode scanner ────────────────────────────────────────────────────

export async function scanQrCode(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { BarcodeScanner, BarcodeFormat } = await getBarcodeScanner();

    const { camera } = await BarcodeScanner.requestPermissions();
    if (camera !== 'granted' && camera !== 'limited') {
      console.warn('[cap] Camera permission denied for QR scan');
      return null;
    }

    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
    });
    return barcodes[0]?.rawValue ?? null;
  } catch (e) {
    console.warn('[cap] QR scan failed', e);
    return null;
  }
}

// ─── Biometric auth ──────────────────────────────────────────────────────────

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const info = await BiometricAuth.checkBiometry();
    return info.isAvailable;
  } catch {
    return false;
  }
}

export async function authenticateWithBiometrics(reason: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Use password instead',
      allowDeviceCredential: true,
    });
    return true;
  } catch (e) {
    console.warn('[cap] Biometric auth failed', e);
    return false;
  }
}

// ─── Secure storage (for biometric session token) ────────────────────────────

const BIOMETRIC_KEY = 'slipatip_biometric_enabled';
const SESSION_KEY = 'slipatip_session_phone';

export async function setBiometricEnabled(phone: string) {
  if (!isNative()) return;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: BIOMETRIC_KEY, value: 'true' });
    await Preferences.set({ key: SESSION_KEY, value: phone });
  } catch (e) {
    console.warn('[cap] Preferences set failed', e);
  }
}

export async function getBiometricPhone(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const enabled = await Preferences.get({ key: BIOMETRIC_KEY });
    if (enabled.value !== 'true') return null;
    const phone = await Preferences.get({ key: SESSION_KEY });
    return phone.value;
  } catch {
    return null;
  }
}

export async function clearBiometric() {
  if (!isNative()) return;
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key: BIOMETRIC_KEY });
    await Preferences.remove({ key: SESSION_KEY });
  } catch (e) {
    console.warn('[cap] Preferences clear failed', e);
  }
}
