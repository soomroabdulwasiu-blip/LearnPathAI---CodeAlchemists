import { TopicId, TopicMastery, RoadmapItem, RoadmapDiff, RoadmapResponse, MasteryStatus } from '../types';
import { TOPICS, TOPIC_MAP } from './constants';

export interface BKTParameters {
  pInit: number; // P(L0)
  pTransit: number; // P(T)
  pGuess: number; // P(G)
  pSlip: number; // P(S)
}

const DEFAULT_BKT_PARAMS: BKTParameters = {
  pInit: 0.25,
  pTransit: 0.18,
  pGuess: 0.20,
  pSlip: 0.12,
};

/**
 * Updates mastery using Bayesian Knowledge Tracing given student response
 */
export function updateBKTMastery(
  currentMasteryScore: number, // 0 to 100
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

/**
 * Computes status of a topic based on prerequisites and current mastery
 */
export function computeTopicStatus(
  topicId: TopicId,
  masteryMap: Record<TopicId, number>
): MasteryStatus {
  const meta = TOPIC_MAP[topicId];
  if (!meta) return 'learn';
  const score = masteryMap[topicId] ?? 0;

  const prereqsSatisfied = meta.prerequisites.every((prereqId) => {
    return (masteryMap[prereqId] ?? 0) >= 50;
  });

  if (!prereqsSatisfied) {
    return 'locked';
  }
  if (score >= 85) return 'skip';
  if (score >= 68) return 'review';
  if (score >= 40) return 'practice';
  return 'learn';
}

/**
 * Computes dynamic prerequisite-aware roadmap ordering
 */
export function generateRoadmap(
  masteryMap: Record<TopicId, number>,
  previousItems?: RoadmapItem[],
  weeklyHours: number = 5
): RoadmapResponse {
  const topoOrder: TopicId[] = [
    'variables',
    'operators',
    'strings',
    'conditionals',
    'loops',
    'lists',
    'dictionaries',
    'functions',
    'exceptions',
    'oop',
  ];

  interface ScoredTopic {
    topicId: TopicId;
    status: MasteryStatus;
    score: number;
    sortKey: number;
    why: string;
    whyUrdu: string;
    estMinutes: number;
  }

  const scored: ScoredTopic[] = TOPICS.map((topic) => {
    const score = masteryMap[topic.id] ?? 0;
    const status = computeTopicStatus(topic.id, masteryMap);
    const meta = TOPIC_MAP[topic.id];

    const estMinutes = Math.max(
      15,
      Math.round(meta.standardEstMinutes * ((100 - Math.min(85, score)) / 100))
    );

    let sortKey = 0;
    let why = '';
    let whyUrdu = '';
    const topoIndex = topoOrder.indexOf(topic.id);

    if (status === 'locked') {
      const missingPrereqs = meta.prerequisites
        .filter((p) => (masteryMap[p] ?? 0) < 50)
        .map((p) => TOPIC_MAP[p].title)
        .join(', ');
      sortKey = 500 + topoIndex;
      why = `Prerequisites not yet solid: complete ${missingPrereqs} first.`;
      whyUrdu = `پیشگی شرائط ابھی مکمل نہیں ہوئیں: پہلے ${missingPrereqs} مکمل کریں۔`;
    } else if (status === 'skip') {
      sortKey = 800 + topoIndex;
      why = `High proficiency (${score}%). Topic already mastered; skipped to save study hours.`;
      whyUrdu = `اعلیٰ مہارت (${score}%)۔ وقت بچانے کے لیے اس عنوان کو چھوڑ دیا گیا ہے۔`;
    } else if (status === 'learn') {
      sortKey = 100 + topoIndex * 10 + score;
      why = `Critical prerequisite knowledge gap (${score}%). Essential foundation for upcoming modules.`;
      whyUrdu = `اہم بنیادی کمی (${score}%)۔ آئندہ اسباق کے لیے لازمی بنیاد۔`;
    } else if (status === 'practice') {
      sortKey = 200 + topoIndex * 8 + score;
      why = `Active growth topic (${score}%). Practice recommended to reach automaticity.`;
      whyUrdu = `فعال سیکھنے کا عنوان (${score}%)۔ خودکار روانی کے لیے مشق تجویز کی گئی ہے۔`;
    } else {
      sortKey = 300 + topoIndex * 5 + score;
      why = `Solid foundation (${score}%). Periodic consolidation to prevent memory decay.`;
      whyUrdu = `مضبوط بنیاد (${score}%)۔ یادداشت برقرار رکھنے کے لیے وقتاً فوقتاً دہرائی۔`;
    }

    return {
      topicId: topic.id,
      status,
      score,
      sortKey,
      why,
      whyUrdu,
      estMinutes,
    };
  });

  scored.sort((a, b) => a.sortKey - b.sortKey);

  const minutesPerWeek = Math.max(120, weeklyHours * 60);
  let cumulativeMinutes = 0;

  const items: RoadmapItem[] = scored.map((item, index) => {
    const rank = index + 1;
    cumulativeMinutes += item.estMinutes;
    const week = Math.max(1, Math.ceil(cumulativeMinutes / minutesPerWeek));
    const prevItem = previousItems?.find((p) => p.topic_id === item.topicId);

    return {
      topic_id: item.topicId,
      rank,
      status: item.status,
      why: item.why,
      whyUrdu: item.whyUrdu,
      est_minutes: item.estMinutes,
      week,
      previous_rank: prevItem?.rank,
    };
  });

  const standard_minutes = TOPICS.reduce((acc, t) => acc + t.standardEstMinutes, 0);
  const personalized_minutes = items
    .filter((i) => i.status !== 'skip')
    .reduce((acc, i) => acc + i.est_minutes, 0);

  const diff: RoadmapDiff[] = [];
  if (previousItems && previousItems.length > 0) {
    items.forEach((item) => {
      const prev = previousItems.find((p) => p.topic_id === item.topic_id);
      if (prev && prev.rank !== item.rank) {
        const topicName = TOPIC_MAP[item.topic_id].title;
        const score = masteryMap[item.topic_id] ?? 0;
        let reason = '';
        let reasonUrdu = '';
        if (item.rank < prev.rank) {
          reason = `${topicName} advanced to Rank #${item.rank}: mastery is at ${score}%, prioritized for immediate review.`;
          reasonUrdu = `${topicName} رینک #${item.rank} پر پہنچ گیا: مہارت ${score}% پر ہے، فوری دہرائی کی ترجیح۔`;
        } else {
          reason = `${topicName} shifted down to Rank #${item.rank}: prerequisites cleared or high confidence reached.`;
          reasonUrdu = `${topicName} رینک #${item.rank} پر منتقل ہو گیا: بنیادی مہارت حاصل ہو گئی۔`;
        }
        diff.push({
          topic_id: item.topic_id,
          from_rank: prev.rank,
          to_rank: item.rank,
          reason,
          reasonUrdu,
        });
      }
    });
  }

  return {
    items,
    standard_minutes,
    personalized_minutes,
    diff: diff.length > 0 ? diff : undefined,
  };
}
