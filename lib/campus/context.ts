import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export type CampusProfile = {
  user_id: string
  institution_id: string
  full_name: string
  title: string | null
  phone: string | null
  department_id: string | null
  status: 'pending' | 'active' | 'suspended'
}

export type CampusRole = {
  role: 'principal' | 'administrator' | 'coordinator' | 'hod' | 'faculty' | 'staff'
  department_id: string | null
  responsibility_id: string | null
}

export type Department = {
  id: string
  institution_id: string
  code: string
  name: string
  description: string | null
  hod_user_id: string | null
  status: 'active' | 'archived'
  created_at: string
}

export type CampusContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  user: User
  profile: CampusProfile
  institution: { id: string; name: string; timezone: string } | null
  roles: CampusRole[]
  unreadCount: number
}

export const getCampusContext = cache(async (): Promise<CampusContext> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=%2Fdashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, institution_id, full_name, title, phone, department_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/login?notice=profile')
  }

  if (profile.status !== 'active') {
    redirect('/pending')
  }

  const [institutionResult, rolesResult, notificationsResult] = await Promise.all([
    supabase
      .from('institutions')
      .select('id, name, timezone')
      .eq('id', profile.institution_id)
      .maybeSingle(),
    supabase
      .from('role_assignments')
      .select('role, department_id, responsibility_id')
      .eq('user_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ])

  return {
    supabase,
    user,
    profile: profile as CampusProfile,
    institution: institutionResult.data as CampusContext['institution'],
    roles: (rolesResult.data ?? []) as CampusRole[],
    unreadCount: notificationsResult.count ?? 0,
  }
})
