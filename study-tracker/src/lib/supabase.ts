import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type TopicStatus = 'not_started' | 'in_progress' | 'finished'

export interface Topic {
  id: string
  subject_id: string
  chapter_id: string
  name: string
  status: TopicStatus
  created_at: string
}

export interface Chapter {
  id: string
  subject_id: string
  name: string
  topics: Topic[]
}

export interface Subject {
  id: string
  name: string
  short_name: string
  color: string
  chapters: Chapter[]
}

export interface TodoItem {
  id: string
  list_id: string
  text: string
  due_date: string
  completed: boolean
  created_at: string
}

export interface TodoList {
  id: string
  title: string
  color: string
  created_at: string
}

export interface AgendaSlot {
  id: string
  slot_date: string
  slot_index: number
  subject_id: string | null
  topic_label: string | null
}