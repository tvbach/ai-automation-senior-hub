import { describe, expect, it } from "vitest";
import {
  computeStreak,
  emptyProgress,
  isSafeEvidenceUrl,
  MAX_ACTIVITY_DAYS,
  MAX_ATTEMPTS,
  mergeProgress,
  PROGRESS_VERSION,
  sanitizeProgress,
  summarizeTopics,
  type ProgressState,
} from "@/lib/progress";

const T0 = Date.UTC(2026, 9, 1, 12); // 2026-10-01
const minutes = (n: number) => T0 + n * 60_000;

function state(partial: Partial<ProgressState> = {}): ProgressState {
  return { ...emptyProgress(), ...partial };
}

/** Bản lưu thật từ schema v1 — đúng hình dạng client/Redis cũ đang giữ */
const V1_SNAPSHOT = {
  version: 1,
  topics: {
    fixtures: { status: "done", at: minutes(1) },
    locators: { status: "in-progress", at: minutes(2) },
  },
  attempts: [{ questionId: "flaky-strategy", score: 72, at: minutes(3) }],
  activity: ["2026-09-30", "2026-10-01"],
};

describe("emptyProgress", () => {
  it("trả về schema mới nhất với mọi collection rỗng", () => {
    expect(emptyProgress()).toEqual({
      version: PROGRESS_VERSION,
      topics: {},
      attempts: [],
      activity: [],
      quizzes: {},
      labs: {},
      assessment: null,
    });
  });
});

describe("migration v1 → v2", () => {
  it("giữ nguyên topics, attempts, activity và thêm field v2 rỗng", () => {
    const migrated = sanitizeProgress(V1_SNAPSHOT);

    expect(migrated.version).toBe(2);
    expect(migrated.topics).toEqual(V1_SNAPSHOT.topics);
    expect(migrated.attempts).toEqual(V1_SNAPSHOT.attempts);
    expect(migrated.activity).toEqual(V1_SNAPSHOT.activity);
    expect(migrated.quizzes).toEqual({});
    expect(migrated.labs).toEqual({});
    expect(migrated.assessment).toBeNull();
  });

  it("idempotent: migrate lần hai không đổi kết quả", () => {
    const once = sanitizeProgress(V1_SNAPSHOT);
    expect(sanitizeProgress(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });

  it("client cũ gửi state v1 không xoá dữ liệu v2 trên server", () => {
    const server = state({
      quizzes: { fixtures: { best: 80, last: 80, at: minutes(5) } },
      labs: { "lab-001": { status: "submitted", evidenceUrl: "https://github.com/me/repo", at: minutes(6) } },
    });
    const merged = mergeProgress(server, sanitizeProgress(V1_SNAPSHOT));

    expect(merged.quizzes).toEqual(server.quizzes);
    expect(merged.labs).toEqual(server.labs);
    expect(merged.topics).toEqual(V1_SNAPSHOT.topics);
  });
});

describe("sanitizeProgress — dữ liệu không tin cậy", () => {
  it.each<[unknown]>([[null], [undefined], [42], ["x"], [[]], [{ topics: "nope" }]])("không throw với input %j", (input) => {
    expect(sanitizeProgress(input)).toEqual(emptyProgress());
  });

  it("loại topic có id, status hoặc timestamp không hợp lệ", () => {
    const out = sanitizeProgress({
      topics: {
        ok: { status: "done", at: minutes(1) },
        "Bad ID": { status: "done", at: minutes(1) },
        "bad-status": { status: "finished", at: minutes(1) },
        "bad-time": { status: "done", at: -1 },
        "future-time": { status: "done", at: Date.UTC(2200, 0, 1) },
      },
    });
    expect(Object.keys(out.topics)).toEqual(["ok"]);
  });

  it("làm tròn điểm, loại điểm ngoài 0–100 và gộp attempt trùng", () => {
    const dup = { questionId: "q-1", score: 70.4, at: minutes(1) };
    const out = sanitizeProgress({
      attempts: [dup, dup, { questionId: "q-1", score: 101, at: minutes(2) }, { questionId: "q-2", score: -1, at: minutes(3) }],
    });
    expect(out.attempts).toEqual([{ questionId: "q-1", score: 70, at: minutes(1) }]);
  });

  it(`giới hạn ${MAX_ATTEMPTS} attempts và ${MAX_ACTIVITY_DAYS} ngày hoạt động gần nhất`, () => {
    const attempts = Array.from({ length: MAX_ATTEMPTS + 20 }, (_, i) => ({ questionId: "q", score: 50, at: minutes(i + 1) }));
    const activity = Array.from({ length: MAX_ACTIVITY_DAYS + 5 }, (_, i) =>
      new Date(T0 + i * 86_400_000).toISOString().slice(0, 10),
    );
    const out = sanitizeProgress({ attempts, activity });

    expect(out.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(out.attempts[0].at).toBe(minutes(21));
    expect(out.activity).toHaveLength(MAX_ACTIVITY_DAYS);
    expect(out.activity.at(-1)).toBe(activity.at(-1));
  });

  it("quiz: best không bao giờ thấp hơn last", () => {
    const out = sanitizeProgress({ quizzes: { fixtures: { best: 40, last: 90, at: minutes(1) } } });
    expect(out.quizzes.fixtures).toEqual({ best: 90, last: 90, at: minutes(1) });
  });

  it("lab: bỏ evidence URL không an toàn nhưng vẫn giữ trạng thái", () => {
    const out = sanitizeProgress({
      labs: {
        "lab-001": { status: "submitted", evidenceUrl: "javascript:alert(1)", at: minutes(1) },
        "lab-002": { status: "submitted", evidenceUrl: "https://github.com/me/qa-shop-tests/pull/3", at: minutes(1) },
        "lab-003": { status: "done", at: minutes(1) },
      },
    });
    expect(out.labs).toEqual({
      "lab-001": { status: "submitted", at: minutes(1) },
      "lab-002": { status: "submitted", evidenceUrl: "https://github.com/me/qa-shop-tests/pull/3", at: minutes(1) },
    });
  });

  it("assessment: chỉ giữ skill id và điểm hợp lệ; rỗng → null", () => {
    expect(
      sanitizeProgress({ assessment: { at: minutes(1), scores: { typescript: 85.6, "Bad Id": 50, "api-testing": 120 } } })
        .assessment,
    ).toEqual({ at: minutes(1), scores: { typescript: 86 } });
    expect(sanitizeProgress({ assessment: { at: minutes(1), scores: {} } }).assessment).toBeNull();
  });
});

describe("isSafeEvidenceUrl", () => {
  it.each<[string, boolean]>([
    ["https://github.com/me/repo", true],
    ["https://gitlab.com/me/repo/-/merge_requests/1", true],
    ["http://github.com/me/repo", false],
    ["javascript:alert(1)", false],
    ["data:text/html,<script>alert(1)</script>", false],
    ["https://user:pass@example.com", false],
    ["not a url", false],
    [`https://example.com/${"a".repeat(300)}`, false],
  ])("%s → %s", (url, expected) => {
    expect(isSafeEvidenceUrl(url)).toBe(expected);
  });
});

describe("mergeProgress", () => {
  const a = state({
    topics: { fixtures: { status: "done", at: minutes(10) }, locators: { status: "in-progress", at: minutes(1) } },
    attempts: [{ questionId: "q-1", score: 60, at: minutes(1) }],
    activity: ["2026-10-01"],
    quizzes: { fixtures: { best: 90, last: 60, at: minutes(9) } },
    labs: { "lab-001": { status: "in-progress", at: minutes(2) } },
    assessment: { at: minutes(1), scores: { typescript: 40 } },
  });
  const b = state({
    topics: { fixtures: { status: "in-progress", at: minutes(5) }, locators: { status: "done", at: minutes(8) } },
    attempts: [{ questionId: "q-2", score: 80, at: minutes(2) }],
    activity: ["2026-10-02"],
    quizzes: { fixtures: { best: 70, last: 70, at: minutes(12) } },
    labs: { "lab-001": { status: "submitted", evidenceUrl: "https://github.com/me/repo", at: minutes(7) } },
    assessment: { at: minutes(3), scores: { typescript: 85 } },
  });

  it("topic, lab và assessment: bản mới nhất thắng", () => {
    const merged = mergeProgress(a, b);
    expect(merged.topics).toEqual({ fixtures: a.topics.fixtures, locators: b.topics.locators });
    expect(merged.labs["lab-001"]).toEqual(b.labs["lab-001"]);
    expect(merged.assessment).toEqual(b.assessment);
  });

  it("quiz: last lấy lần làm mới nhất, best lấy điểm cao nhất", () => {
    expect(mergeProgress(a, b).quizzes.fixtures).toEqual({ best: 90, last: 70, at: minutes(12) });
  });

  it("attempts và activity lấy hợp, có thứ tự", () => {
    const merged = mergeProgress(a, b);
    expect(merged.attempts.map((x) => x.questionId)).toEqual(["q-1", "q-2"]);
    expect(merged.activity).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("giao hoán: thứ tự thiết bị đồng bộ không ảnh hưởng kết quả", () => {
    expect(mergeProgress(a, b)).toEqual(mergeProgress(b, a));
  });

  it("merge với chính nó không đổi gì", () => {
    expect(mergeProgress(a, a)).toEqual(a);
  });
});

describe("computeStreak", () => {
  it("đếm chuỗi tính đến hôm nay và kỷ lục", () => {
    const days = ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-07", "2026-10-08"];
    expect(computeStreak(days, "2026-10-08")).toEqual({ current: 2, best: 3, activeToday: true });
  });

  it("hôm nay chưa học thì vẫn giữ chuỗi tới hôm qua", () => {
    expect(computeStreak(["2026-10-06", "2026-10-07"], "2026-10-08")).toEqual({ current: 2, best: 2, activeToday: false });
  });

  it("đứt chuỗi khi bỏ quá một ngày", () => {
    expect(computeStreak(["2026-10-05"], "2026-10-08").current).toBe(0);
  });

  it("vượt qua cuối tháng và năm nhuận", () => {
    expect(computeStreak(["2028-02-28", "2028-02-29", "2028-03-01"], "2028-03-01").current).toBe(3);
  });
});

describe("summarizeTopics", () => {
  it("tính done, in-progress và phần trăm; topic chưa có dữ liệu là todo", () => {
    const s = state({
      topics: { a: { status: "done", at: minutes(1) }, b: { status: "in-progress", at: minutes(1) } },
    });
    expect(summarizeTopics(s, ["a", "b", "c"])).toEqual({ total: 3, done: 1, inProgress: 1, percent: 33 });
    expect(summarizeTopics(s, [])).toEqual({ total: 0, done: 0, inProgress: 0, percent: 0 });
  });
});
