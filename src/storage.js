// 스토리지 어댑터
// 원본 아티팩트는 Claude 전용 window.storage API를 썼다.
// 로컬/일반 웹 환경에서는 localStorage로 대체하되, 인터페이스는 동일하게 유지:
//   await storage.get(key)  → { key, value } | null
//   await storage.set(key, value) → { key, value }
// 나중에 서버 동기화(예: Supabase, 자체 API)로 바꿀 때 이 파일만 교체하면 된다.

const memoryFallback = {};

export const storage = {
  async get(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : { key, value: v };
    } catch {
      return key in memoryFallback ? { key, value: memoryFallback[key] } : null;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryFallback[key] = value;
    }
    return { key, value };
  },

  async delete(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryFallback[key];
    }
    return { key, deleted: true };
  },
};
