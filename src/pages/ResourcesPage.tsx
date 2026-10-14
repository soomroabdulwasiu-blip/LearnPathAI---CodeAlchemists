import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { SEED_ALL_RESOURCES } from '../data/seedData';
import { TOPICS, TOPIC_MAP } from '../lib/constants';
import { ResourceItem } from '../types';
import { Button } from '../components/ui/Button';
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Code2,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredResources = SEED_ALL_RESOURCES.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase());
    const matchesTopic = topicFilter === 'all' || res.topic_id === topicFilter;
    const matchesDifficulty = difficultyFilter === 'all' || res.level === difficultyFilter;
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    return matchesSearch && matchesTopic && matchesDifficulty && matchesType;
  });

  const resetFilters = () => {
    setSearch('');
    setTopicFilter('all');
    setDifficultyFilter('all');
    setTypeFilter('all');
  };

  const getTypeIcon = (type: ResourceItem['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-3.5 h-3.5" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5" />;
      case 'exercise':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'doc':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#06B6D4]/10 text-[#0891B2] dark:text-[#22D3EE] mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curated Learning Repository</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
          {t('content_title')}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Explore interactive lessons, written notes, coding patterns, and video explanations for Python Fundamentals.
        </p>
      </div>

      <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--line)] shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lessons, documentation, or exercises..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF]"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none"
            >
              <option value="all">All Topics (10)</option>
              {TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none"
            >
              <option value="all">All Formats</option>
              <option value="lesson">Interactive Lessons</option>
              <option value="doc">Written Notes</option>
              <option value="video">Video Tutorials</option>
              <option value="code">Coding Examples</option>
              <option value="exercise">Practice Exercises</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line)] text-xs">
          <span className="text-[11px] text-[var(--muted)]">
            Showing {filteredResources.length} of {SEED_ALL_RESOURCES.length} learning resources
          </span>
          {(search || topicFilter !== 'all' || typeFilter !== 'all' || difficultyFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-[#2D5BFF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-[var(--line)] space-y-4">
          <BookOpen className="w-10 h-10 text-[var(--muted)] mx-auto opacity-50" />
          <h3 className="font-display font-bold text-lg text-[var(--ink)]">
            No resources match your filters
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            Try resetting your topic or format filter to view all available learning materials.
          </p>
          <Button size="sm" variant="secondary" onClick={resetFilters} className="cursor-pointer">
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => {
            const topic = (res.topic_id && TOPIC_MAP[res.topic_id]) || TOPIC_MAP.variables;
            return (
              <div
                key={res.id}
                className="p-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] hover:border-[#2D5BFF]/40 hover:shadow-[var(--shadow-md)] transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: topic.hue }}
                    >
                      {topic.title.split(' ')[0]}
                    </span>
                    <span className="capitalize text-[11px] text-[var(--muted)] font-medium">
                      {res.level || 'all levels'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-[var(--ink)] group-hover:text-[#2D5BFF] transition-colors leading-snug">
                      {res.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1 leading-relaxed">
                      {res.description}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    {getTypeIcon(res.type)}
                    <span className="capitalize">{res.type} • {res.duration}</span>
                  </div>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2D5BFF] hover:underline"
                  >
                    <span>Start</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
