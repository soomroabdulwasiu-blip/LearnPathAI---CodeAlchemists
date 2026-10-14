import { TopicId, RoadmapItem, RoadmapDiff, RoadmapResponse } from '../../types';
import { TOPICS, TOPIC_MAP } from '../../lib/constants';
import { computeTopicStatus } from './bkt';

const TOPO_ORDER: TopicId[] = [
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
  id: TopicId;
  priorityScore: number;
}

export function generateRoadmap(
  masteryMap: Record<TopicId, number>,
  previousItems?: RoadmapItem[],
  weeklyHours: number = 5
): RoadmapResponse {
  const scoredTopics: ScoredTopic[] = [];

  for (const topic of TOPICS) {
    const score = masteryMap[topic.id] ?? 0;
    const status = computeTopicStatus(topic.id, masteryMap);
    let priority = 100 - score;

    if (status === 'learn' || status === 'practice') {
      priority += 35;
    } else if (status === 'locked') {
      priority -= 50;
    } else if (status === 'skip') {
      priority -= 40;
    }

    const topoIndex = TOPO_ORDER.indexOf(topic.id);
    priority += (TOPO_ORDER.length - topoIndex) * 2;
    scoredTopics.push({ id: topic.id, priorityScore: priority });
  }

  scoredTopics.sort((a, b) => b.priorityScore - a.priorityScore);

  let cumulativeMinutes = 0;
  const weeklyMinutes = Math.max(60, (weeklyHours || 5) * 60);

  const items: RoadmapItem[] = scoredTopics.map((item, index) => {
    const meta = TOPIC_MAP[item.id];
    const status = computeTopicStatus(item.id, masteryMap);
    const score = masteryMap[item.id] ?? 0;

    let estMinutes = meta.standardEstMinutes;
    if (status === 'skip') estMinutes = 0;
    else if (status === 'review') estMinutes = Math.round(meta.standardEstMinutes * 0.4);
    else if (status === 'practice') estMinutes = Math.round(meta.standardEstMinutes * 0.7);

    cumulativeMinutes += estMinutes;
    const weekNumber = Math.max(1, Math.ceil(cumulativeMinutes / weeklyMinutes));
    const prevRank = previousItems?.find((pi) => pi.topic_id === item.id)?.rank;

    const why =
      status === 'skip'
        ? 'Topic mastered (≥ 85%); placed in maintenance review.'
        : status === 'locked'
        ? `Requires prerequisite foundation (need ≥ 50% in ${meta.prerequisites.join(', ')}).`
        : status === 'review'
        ? 'Retention decay detected; scheduled for active recall.'
        : `High impact for mastery progression; currently at ${score}%.`;

    const whyUrdu =
      status === 'skip'
        ? 'عنوان مکمل ہو چکا ہے۔'
        : status === 'locked'
        ? 'پیشگی شرائط درکار ہیں۔'
        : `مہارت بڑھانے کے لیے اہم، موجودہ اسکور: ${score}%۔`;

    return {
      topic_id: item.id,
      rank: index + 1,
      previous_rank: prevRank,
      status,
      why,
      whyUrdu,
      est_minutes: estMinutes,
      week: weekNumber,
    };
  });

  const diffs: RoadmapDiff[] = [];
  if (previousItems && previousItems.length > 0) {
    items.forEach((newItem) => {
      const oldItem = previousItems.find((pi) => pi.topic_id === newItem.topic_id);
      if (oldItem && oldItem.rank !== newItem.rank) {
        diffs.push({
          topic_id: newItem.topic_id,
          from_rank: oldItem.rank,
          to_rank: newItem.rank,
          reason: `Re-ranked from #${oldItem.rank} to #${newItem.rank} based on Bayesian mastery update.`,
          reasonUrdu: `درجہ #${oldItem.rank} سے #${newItem.rank} میں تبدیل۔`,
        });
      }
    });
  }

  const standardMinutes = TOPICS.reduce((acc, t) => acc + t.standardEstMinutes, 0);
  const personalizedMinutes = items.reduce((acc, it) => acc + it.est_minutes, 0);

  return {
    items,
    standard_minutes: standardMinutes,
    personalized_minutes: personalizedMinutes,
    diff: diffs.length > 0 ? diffs : undefined,
  };
}
