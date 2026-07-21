import { artUrl } from "../data/defaults";

// 사전 생성 삽화 — 없는 동작(사용자 추가분 등)은 조용히 숨긴다.
// key=ex.id로 동작이 바뀔 때마다 img를 새로 마운트해 onError의 숨김 상태를 초기화.
export default function ExerciseArt({ ex, className }) {
  const url = artUrl(ex);
  if (!url) return null;
  return (
    <img
      key={ex.id}
      className={className}
      src={url}
      alt={`${ex.name} 자세`}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
