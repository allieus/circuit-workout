import { useEffect } from "react";

// 타이머 도중 화면 꺼짐 방지 (Screen Wake Lock API — iOS Safari 16.4+ 지원)
// 잠금 화면이나 다른 앱을 다녀오면 lock이 자동 해제되므로 visibilitychange에서 재요청한다.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release().catch(() => {});
      } catch (e) {
        // 저전력 모드 등에서 거부될 수 있음 — 앱 동작에는 지장 없음
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
