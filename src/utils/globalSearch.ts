import { beritaData, eventData, programKerjaData } from '../data';
import type { BeritaItem, EventItem, ProgramKerja } from '../types';

export type SearchCategory = 'all' | 'berita' | 'event' | 'program';
export type SearchResultType = 'berita' | 'event' | 'program';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  typeLabel: string;
  title: string;
  subtitle: string;
  meta: string;
  categoryLabel: string;
  href: string;
  accentColor: string;
  score: number;
}

export interface SearchCounts {
  all: number;
  berita: number;
  event: number;
  program: number;
}

export interface GlobalSearchResponse {
  results: SearchResultItem[];
  counts: SearchCounts;
  query: string;
}

function formatShortDate(dateStr: string): string {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function scoreField(text: string | undefined, terms: string[], weight: number): number {
  if (!text) return 0;
  const normalized = text.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (normalized === term) {
      score += weight * 3;
    } else if (normalized.startsWith(term)) {
      score += weight * 2;
    } else if (normalized.includes(term)) {
      score += weight;
    }
  }
  return score;
}

function matchesAllTerms(searchableText: string, terms: string[]): boolean {
  const normalized = searchableText.toLowerCase();
  return terms.every((term) => normalized.includes(term));
}

function mapBeritaToResult(item: BeritaItem, score: number): SearchResultItem {
  return {
    id: `berita-${item.id}`,
    type: 'berita',
    typeLabel: 'Berita',
    title: item.title,
    subtitle: item.excerpt,
    meta: `${formatShortDate(item.date)} · ${item.author}`,
    categoryLabel: item.category,
    href: `/beranda/berita/${item.slug}`,
    accentColor: '#845CBC',
    score,
  };
}

function mapEventToResult(item: EventItem, score: number): SearchResultItem {
  const statusLabel =
    item.status === 'upcoming'
      ? 'Mendatang'
      : item.status === 'ongoing'
        ? 'Berlangsung'
        : 'Selesai';
  return {
    id: `event-${item.id}`,
    type: 'event',
    typeLabel: 'Event',
    title: item.title,
    subtitle: item.description,
    meta: `${formatShortDate(item.date)} · ${item.time} WITA · ${item.location}`,
    categoryLabel: `${item.category} · ${statusLabel}`,
    href: `/beranda/event?highlight=${encodeURIComponent(item.slug)}`,
    accentColor: '#C9A84C',
    score,
  };
}

function mapProgramToResult(item: ProgramKerja, score: number): SearchResultItem {
  return {
    id: `program-${item.id}`,
    type: 'program',
    typeLabel: 'Program Kerja',
    title: item.title,
    subtitle: item.description,
    meta: `${item.komisi}${item.pj ? ` · ${item.pj}` : ''}`,
    categoryLabel: item.frekuensi || item.komisi,
    href: `/beranda/program-kerja/${item.slug}`,
    accentColor: item.komisiColor || '#6B3FA0',
    score,
  };
}

export function searchGlobalContent(
  query: string,
  category: SearchCategory = 'all',
  limit = 18
): GlobalSearchResponse {
  const trimmed = query.trim();
  const terms = trimmed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    const defaultBerita = beritaData.slice(0, 2).map((b, i) => mapBeritaToResult(b, 10 - i));
    const defaultEvents = eventData
      .filter((e) => e.status !== 'past')
      .slice(0, 2)
      .map((e, i) => mapEventToResult(e, 10 - i));
    const defaultPrograms = programKerjaData
      .slice(0, 3)
      .map((p, i) => mapProgramToResult(p, 10 - i));

    const allSuggestions = [...defaultBerita, ...defaultEvents, ...defaultPrograms];
    const counts: SearchCounts = {
      all: allSuggestions.length,
      berita: defaultBerita.length,
      event: defaultEvents.length,
      program: defaultPrograms.length,
    };

    const filteredSuggestions =
      category === 'all'
        ? allSuggestions
        : allSuggestions.filter((item) => item.type === category);

    return {
      results: filteredSuggestions.slice(0, limit),
      counts,
      query: trimmed,
    };
  }

  const matchedBerita: SearchResultItem[] = [];
  for (const item of beritaData) {
    const combined = `${item.title} ${item.excerpt} ${item.category} ${item.author} ${item.date}`;
    if (!matchesAllTerms(combined, terms)) continue;

    const score =
      scoreField(item.title, terms, 12) +
      scoreField(item.category, terms, 7) +
      scoreField(item.author, terms, 5) +
      scoreField(item.excerpt, terms, 4);

    matchedBerita.push(mapBeritaToResult(item, score));
  }

  const matchedEvents: SearchResultItem[] = [];
  for (const item of eventData) {
    const combined = `${item.title} ${item.description} ${item.category} ${item.location} ${item.date} ${item.status}`;
    if (!matchesAllTerms(combined, terms)) continue;

    const score =
      scoreField(item.title, terms, 12) +
      scoreField(item.category, terms, 7) +
      scoreField(item.location, terms, 6) +
      scoreField(item.description, terms, 4);

    matchedEvents.push(mapEventToResult(item, score));
  }

  const matchedPrograms: SearchResultItem[] = [];
  for (const item of programKerjaData) {
    const combined = [
      item.title,
      item.description,
      item.komisi,
      item.frekuensi,
      item.tujuan,
      item.fungsi,
      item.pj,
      item.timeline,
      item.targetOutput,
    ]
      .filter(Boolean)
      .join(' ');

    if (!matchesAllTerms(combined, terms)) continue;

    const score =
      scoreField(item.title, terms, 12) +
      scoreField(item.komisi, terms, 8) +
      scoreField(item.pj, terms, 6) +
      scoreField(item.tujuan, terms, 5) +
      scoreField(item.description, terms, 4);

    matchedPrograms.push(mapProgramToResult(item, score));
  }

  const sortByScore = (a: SearchResultItem, b: SearchResultItem) => b.score - a.score;
  matchedBerita.sort(sortByScore);
  matchedEvents.sort(sortByScore);
  matchedPrograms.sort(sortByScore);

  const counts: SearchCounts = {
    all: matchedBerita.length + matchedEvents.length + matchedPrograms.length,
    berita: matchedBerita.length,
    event: matchedEvents.length,
    program: matchedPrograms.length,
  };

  let combinedResults: SearchResultItem[];
  if (category === 'berita') {
    combinedResults = matchedBerita;
  } else if (category === 'event') {
    combinedResults = matchedEvents;
  } else if (category === 'program') {
    combinedResults = matchedPrograms;
  } else {
    combinedResults = [...matchedBerita, ...matchedEvents, ...matchedPrograms].sort(sortByScore);
  }

  return {
    results: combinedResults.slice(0, limit),
    counts,
    query: trimmed,
  };
}
