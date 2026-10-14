import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RoadmapItem, TopicId } from '../../types';
import { RoadmapNode } from './RoadmapNode';

interface RoadmapGraphProps {
  items: RoadmapItem[];
  masteryMap: Record<TopicId, number>;
}

const nodeTypes = {
  customRoadmapNode: RoadmapNode,
};

const DAG_COORDINATES: Record<TopicId, { x: number; y: number }> = {
  variables: { x: 320, y: 30 },
  operators: { x: 320, y: 190 },
  strings: { x: 80, y: 350 },
  conditionals: { x: 540, y: 350 },
  loops: { x: 540, y: 510 },
  lists: { x: 300, y: 670 },
  functions: { x: 700, y: 670 },
  dictionaries: { x: 300, y: 830 },
  exceptions: { x: 820, y: 830 },
  oop: { x: 520, y: 990 },
};

const DAG_EDGES: { id: string; source: TopicId; target: TopicId }[] = [
  { id: 'e-var-op', source: 'variables', target: 'operators' },
  { id: 'e-op-str', source: 'operators', target: 'strings' },
  { id: 'e-op-cond', source: 'operators', target: 'conditionals' },
  { id: 'e-cond-loop', source: 'conditionals', target: 'loops' },
  { id: 'e-loop-lst', source: 'loops', target: 'lists' },
  { id: 'e-loop-fn', source: 'loops', target: 'functions' },
  { id: 'e-lst-dict', source: 'lists', target: 'dictionaries' },
  { id: 'e-fn-exc', source: 'functions', target: 'exceptions' },
  { id: 'e-cond-exc', source: 'conditionals', target: 'exceptions' },
  { id: 'e-fn-oop', source: 'functions', target: 'oop' },
  { id: 'e-dict-oop', source: 'dictionaries', target: 'oop' },
];

export const RoadmapGraph: React.FC<RoadmapGraphProps> = ({ items, masteryMap }) => {
  const nodes: Node[] = useMemo(() => {
    return items.map((item) => {
      const pos = DAG_COORDINATES[item.topic_id] || { x: 300, y: 100 };
      return {
        id: item.topic_id,
        type: 'customRoadmapNode',
        position: pos,
        data: {
          topicId: item.topic_id,
          mastery: masteryMap[item.topic_id] ?? 0,
          status: item.status,
          rank: item.rank,
          previousRank: item.previous_rank,
          why: item.why,
          whyUrdu: item.whyUrdu,
          estMinutes: item.est_minutes,
          week: item.week,
        },
      };
    });
  }, [items, masteryMap]);

  const edges: Edge[] = useMemo(() => {
    return DAG_EDGES.map((edge) => {
      const isSourceMastered = (masteryMap[edge.source] ?? 0) >= 50;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: !isSourceMastered,
        style: {
          stroke: isSourceMastered ? '#2D5BFF' : 'var(--line)',
          strokeWidth: isSourceMastered ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSourceMastered ? '#2D5BFF' : 'var(--muted)',
          width: 16,
          height: 16,
        },
      };
    });
  }, [masteryMap]);

  return (
    <div className="w-full h-[650px] rounded-3xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden shadow-[var(--shadow-sm)] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        className="touch-pan-y"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="var(--line)"
        />
        <Controls
          showInteractive={false}
          className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden shadow-md"
        />
      </ReactFlow>
    </div>
  );
};
