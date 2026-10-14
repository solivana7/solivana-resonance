import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Chrome/Edge: listens for the `beforeinstallprompt` event and shows our own
 * brand-styled install banner after the user has completed at least one
 * session. Safari/iOS doesn't expose this API — we surface a one-line tip
 * pointing at Share → Add to Home Screen instead.
 *
 * Snooze for 14 days on dismiss so we don't pester.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const SNOOZE_KEY = 'solivana-resonance-install-snoozed-until';
const SHOW_AFTER_KEY = 'solivana-resonance-completed-sessions';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already installed → never show
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Snooze respected
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozedUntil > Date.now()) return;

    // Only show after user has completed at least one session
    const completed = Number(localStorage.getItem(SHOW_AFTER_KEY) || 0);
    if (completed < 1) return;

    // iOS Safari has no prompt API — show the manual tip
    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const snoozeForDays = (days: number) => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
    setVisible(false);
  };

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'dismissed') {
      snoozeForDays(14);
    } else {
      setVisible(false);
    }
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className="fixed z-[55] font-body"
      style={{
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 480,
        marginLeft: 'auto',
        marginRight: 'auto',
        background: '#FFFFFF',
        border: '1px solid rgba(51,29,1,0.10)',
        borderRadius: 12,
        padding: 18,
        boxShadow: '0 12px 36px rgba(51,29,1,0.18)',
        color: '#331D01',
      }}
    >
      <button
        type="button"
        onClick={() => snoozeForDays(14)}
        aria-label="Dismiss install prompt"
        className="absolute top-2 right-2 bg-transparent border-none cursor-pointer"
        style={{ color: 'rgba(51,29,1,0.4)', padding: 4 }}
      >
        <X size={18} aria-hidden="true" />
      </button>
      <p
        id="install-prompt-title"
        className="font-hero uppercase"
        style={{ fontSize: 11, letterSpacing: '0.18em', color: '#EC9247', marginBottom: 6 }}
      >
        Quick add
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        Keep SoliVana Resonance on your home screen
      </p>
      {isIOS ? (
        <p style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)', lineHeight: 1.6 }}>
          In Safari: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. One tap to start a session, no app to download.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)', lineHeight: 1.6, marginBottom: 10 }}>
            One tap to start a session. No app store, no download.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onInstall}
              className="font-body uppercase cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.14em',
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
              }}
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => snoozeForDays(14)}
              className="font-body uppercase cursor-pointer"
              style={{
                background: 'transparent',
                color: 'rgba(51,29,1,0.6)',
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.14em',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(51,29,1,0.15)',
              }}
            >
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
