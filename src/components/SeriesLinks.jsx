import { SERIES, SELF_ID, REPO_URL } from "../data/series";

// 시리즈 다른 앱 링크 + 만드는 법 — 홈 하단 푸터
export default function SeriesLinks() {
  const others = SERIES.filter((s) => s.id !== SELF_ID);
  return (
    <div className="series">
      {others.length > 0 && (
        <>
          <div className="series-title">이런 뽑기도 있어요</div>
          {others.map((s) => (
            <a key={s.id} className="series-item" href={s.url} target="_blank" rel="noreferrer">
              <span className="series-item-name">{s.name}</span>
              <span className="series-item-desc">{s.desc}</span>
              <span className="series-item-arrow">↗</span>
            </a>
          ))}
        </>
      )}
      <a className="series-repo" href={REPO_URL} target="_blank" rel="noreferrer">
        이 앱, 코딩 없이 만들었어요 — 만드는 법 보기 ↗
      </a>
    </div>
  );
}
