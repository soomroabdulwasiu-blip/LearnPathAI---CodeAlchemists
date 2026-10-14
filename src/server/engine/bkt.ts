import { TopicId, MasteryStatus } from '../../types';
import { TOPIC_MAP } from '../../lib/constants';

export interface BKTParameters {
  pInit: number;    // P(L0)
  pTransit: number; // P(T)
  pGuess: number;   // P(G)
  pSlip: number;    // P(S)
}

export const DEFAULT_BKT_PARAMS: BKTParameters = {
  pInit: 0.25,
  pTransit: 0.18,
  pGuess: 0.20,
  pSlip: 0.12,
};

export function updateBKTMastery(
  currentMasteryScore: number,
  isCorrect: boolean,
  params: BKTParameters = DEFAULT_BKT_PARAMS
): { newMasteryScore: number; confidence: number } {
  const pCurrent = Math.max(0.01, Math.min(0.99, currentMasteryScore / 100));
  let pPosterior: number;
  if (isCorrect) {
    const numerator = pCurrent * (1 - params.pSlip);
    const denominator = numerator + (1 - pCurrent) * params.pGuess;
    pPosterior = numerator / Math.max(0.0001, denominator);
  } else {
    const numerator = pCurrent * params.pSlip;
    const denominator = numerator + (1 - pCurrent) * (1 - params.pGuess);
    pPosterior = numerator / Math.max(0.0001, denominator);
  }

  const pLearnedNext = pPosterior + (1 - pPosterior) * params.pTransit;
  const newMasteryScore = Math.round(Math.max(5, Math.min(98, pLearnedNext * 100)));
  const confidence = Math.min(1, Math.max(0.4, Math.abs(newMasteryScore - 50) / 45 + 0.3));

  return {
    newMasteryScore,
    confidence: Number(confidence.toFixed(2)),
  };
}

export function computeTopicStatus(
  topicId: TopicId,
  masteryMap: Record<TopicId, number>
): MasteryStatus {
  const meta = TOPIC_MAP[topicId];
  if (!meta) return 'learn';
  const score = masteryMap[topicId] ?? 0;

  const prereqsSatisfied = meta.prerequisites.every((prereqId) => (masteryMap[prereqId] ?? 0) >= 50);
  if (!prereqsSatisfied) return 'locked';
  if (score >= 85) return 'skip';
  if (score >= 68) return 'review';
  if (score >= 40) return 'practice';
  return 'learn';
}
