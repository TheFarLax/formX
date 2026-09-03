/**
 * Local draft persistence.
 *
 * The parser is deliberately paranoid — the stored value is user-editable — and
 * every access has to survive storage being unavailable, which is what Safari in
 * private mode does.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearDraft,
  isResumable,
  loadDraft,
  markSubmitted,
  newEntryId,
  saveDraft,
  submittedEntryId,
} from '@/lib/draft';
import type { Draft } from '@/lib/draft';

const DRAFT_KEY = 'xasri.survey.draft.v1';

function memoryStorage(map: Map<string, string>): Storage {
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  } as Storage;
}

function setWindow(value: unknown): void {
  Object.defineProperty(globalThis, 'window', { value, configurable: true, writable: true });
}

let store: Map<string, string>;

beforeEach(() => {
  store = new Map();
  setWindow({ localStorage: memoryStorage(store) });
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const draft: Draft = {
  version: 1,
  entryId: '4b3a9b3e-9c1a-4b8e-8b6f-2f0a5d7c1e11',
  startedAt: 1_760_000_000_000,
  savedAt: 1_760_000_060_000,
  sectionId: 'problems',
  answers: { ai_use_cases: ['coding'], biggest_ai_problem: 'Context loss.' },
  consents: { research: true, marketing: false, reward: true },
};

describe('round trip', () => {
  it('restores what it saved', () => {
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
  });

  it('clears on request', () => {
    saveDraft(draft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('returns null when nothing is stored', () => {
    expect(loadDraft()).toBeNull();
  });
});

describe('parsing untrusted storage', () => {
  it('discards malformed JSON', () => {
    store.set(DRAFT_KEY, '{not json');
    expect(loadDraft()).toBeNull();
  });

  it.each(['null', '"a string"', '[]', '42'])('discards the non-object %s', (raw) => {
    store.set(DRAFT_KEY, raw);
    expect(loadDraft()).toBeNull();
  });

  it('discards an unknown version', () => {
    store.set(DRAFT_KEY, JSON.stringify({ ...draft, version: 2 }));
    expect(loadDraft()).toBeNull();
  });

  it.each(['entryId', 'startedAt', 'answers', 'consents'])('discards a draft missing %s', (key) => {
    const partial: Record<string, unknown> = { ...draft };
    delete partial[key];
    store.set(DRAFT_KEY, JSON.stringify(partial));
    expect(loadDraft()).toBeNull();
  });

  it('drops question ids that are not part of the survey', () => {
    store.set(
      DRAFT_KEY,
      JSON.stringify({ ...draft, answers: { ...draft.answers, injected: 'value' } }),
    );
    expect(loadDraft()?.answers).toEqual(draft.answers);
  });

  it('drops answers of the wrong shape', () => {
    store.set(
      DRAFT_KEY,
      JSON.stringify({
        ...draft,
        answers: { ai_tools: [1, 2], country: { nested: true }, email: 'person@example.com' },
      }),
    );
    expect(loadDraft()?.answers).toEqual({ email: 'person@example.com' });
  });

  it('coerces anything but true to false in consents', () => {
    store.set(
      DRAFT_KEY,
      JSON.stringify({ ...draft, consents: { research: 'yes', marketing: 1, reward: true } }),
    );
    expect(loadDraft()?.consents).toEqual({ research: false, marketing: false, reward: true });
  });

  it('falls back to startedAt when savedAt is missing', () => {
    const partial: Record<string, unknown> = { ...draft };
    delete partial.savedAt;
    store.set(DRAFT_KEY, JSON.stringify(partial));
    expect(loadDraft()?.savedAt).toBe(draft.startedAt);
  });
});

describe('resumability', () => {
  it('ignores a draft with nothing answered', () => {
    expect(isResumable({ ...draft, answers: {} })).toBe(false);
    expect(isResumable({ ...draft, answers: { biggest_ai_problem: '   ', ai_tools: [] } })).toBe(
      false,
    );
    expect(isResumable(null)).toBe(false);
  });

  it('offers a draft with real work in it', () => {
    expect(isResumable(draft)).toBe(true);
    expect(isResumable({ ...draft, answers: { ai_tools: ['claude'] } })).toBe(true);
  });
});

describe('submitted marker', () => {
  it('remembers the submitted entry id', () => {
    expect(submittedEntryId()).toBeNull();
    markSubmitted(draft.entryId);
    expect(submittedEntryId()).toBe(draft.entryId);
  });
});

describe('unavailable storage', () => {
  beforeEach(() => {
    setWindow({
      get localStorage(): Storage {
        throw new Error('storage is blocked');
      },
    });
  });

  it('degrades instead of throwing', () => {
    expect(loadDraft()).toBeNull();
    expect(submittedEntryId()).toBeNull();
    expect(() => saveDraft(draft)).not.toThrow();
    expect(() => clearDraft()).not.toThrow();
    expect(() => markSubmitted(draft.entryId)).not.toThrow();
  });
});

describe('server rendering', () => {
  it('treats a missing window as no storage', () => {
    delete (globalThis as { window?: unknown }).window;
    expect(loadDraft()).toBeNull();
    expect(() => saveDraft(draft)).not.toThrow();
  });
});

describe('entry ids', () => {
  it('generates distinct v4 uuids', () => {
    const first = newEntryId();
    const second = newEntryId();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(first).not.toBe(second);
  });
});
