import type { Lesson } from "./types";
import { phase1Lessons } from "./phase-1";
import { phase2Lessons } from "./phase-2";
import { phase3Lessons } from "./phase-3";

const ALL: Lesson[] = [...phase1Lessons, ...phase2Lessons, ...phase3Lessons];

const BY_TOPIC = new Map(ALL.map((l) => [l.topicId, l]));

export function getLesson(topicId: string): Lesson | undefined {
  return BY_TOPIC.get(topicId);
}

export type { Lesson } from "./types";
