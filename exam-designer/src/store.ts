import { createStore, del, entries, get, set } from 'idb-keyval';
import type { Exam } from './types';
import { normalizeExam } from './model';

const store = createStore('exam-designer', 'exams');

export async function listExams(): Promise<Exam[]> {
  const all = await entries<string, Exam>(store);
  return all.map(([, e]) => normalizeExam(e)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadExam(id: string): Promise<Exam | null> {
  const e = await get<Exam>(id, store);
  return e ? normalizeExam(e) : null;
}

export const saveExam = (e: Exam) => set(e.id, e, store);
export const deleteExam = (id: string) => del(id, store);
