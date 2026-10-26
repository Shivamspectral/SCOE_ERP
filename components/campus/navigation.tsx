'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Activity,
  Wallet, BriefcaseBusiness, Wrench,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardClock,
  FileText,
  GraduationCap,
  ClipboardList,
  ShieldCheck,
  LayoutDashboard,
  Megaphone,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type NavigationItem = { href: string; label: string; icon: LucideIcon }
type NavigationGroup = { label: string; items: NavigationItem[] }

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Students & admissions',
    items: [
      { href: '/students', label: 'Students', icon: GraduationCap },
      { href: '/admissions', label: 'Admissions', icon: Users },
      { href: '/placements', label: 'Placements', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'Departments & academics',
    items: [
      { href: '/departments', label: 'Departments', icon: Building2 },
      { href: '/syllabus', label: 'Syllabus progress', icon: BookOpenCheck },
      { href: '/timetable', label: 'Timetable', icon: CalendarDays },
      { href: '/attendance', label: 'Attendance', icon: ClipboardClock },
    ],
  },
  {
    label: 'Faculty & staff',
    items: [
      { href: '/people', label: 'People & staff', icon: Users },
      { href: '/faculty-workspace', label: 'Faculty Workbench', icon: ClipboardList },
      { href: '/hod-workspace', label: 'HOD Workspace', icon: ShieldCheck },
    ],
  },
  {
    label: 'Finance & resources',
    items: [
      { href: '/finance', label: 'Fees & finance', icon: Wallet },
      { href: '/facilities', label: 'Facilities & assets', icon: Wrench },
    ],
  },
  {
    label: 'Operations & approvals',
    items: [
      { href: '/approvals', label: 'Approvals', icon: ClipboardCheck },
      { href: '/workflows', label: 'Requests & tasks', icon: Workflow },
      { href: '/documents', label: 'Document register', icon: FileText },
    ],
  },
  {
    label: 'Communications & activity',
    items: [
      { href: '/circulars', label: 'Circulars & notices', icon: Megaphone },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/activity', label: 'Activity log', icon: Activity },
    ],
  },
]

const classYears = [
  { label: '2nd Year', value: '2nd Year' },
  { label: '3rd Year', value: '3rd Year' },
  { label: '4th Year', value: '4th Year' },
]

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function CampusNavigation({ unreadCount = 0, mobile = false, roles = [] }: { unreadCount?: number; mobile?: boolean; roles?: string[] }) {
  const pathname = usePathname()
  const visibleNavigationGroups = navigationGroups.map((group) => ({ ...group, items: group.items.filter((item) => roles.some((role) => ['principal', 'administrator'].includes(role)) || !['/students', '/admissions', '/finance', '/placements', '/facilities'].includes(item.href)).filter((item) => item.href === '/faculty-workspace' ? roles.some((role) => ['faculty', 'hod'].includes(role)) : item.href === '/hod-workspace' ? roles.includes('hod') : item.href === '/attendance' ? roles.some((role) => ['faculty','hod','principal','administrator','coordinator'].includes(role)) : true) })).filter((group) => group.items.length > 0)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(navigationGroups.map((group) => group.label))
  const [classesExpanded, setClassesExpanded] = useState(false)

  useEffect(() => {
    const activeGroup = visibleNavigationGroups.find((group) => group.items.some((item) => isItemActive(pathname, item.href)))
    if (activeGroup) {
      setExpandedGroups((current) => current.includes(activeGroup.label) ? current : [...current, activeGroup.label])
    }
    if (pathname.startsWith('/timetable')) setClassesExpanded(true)
  }, [pathname])

  const groups = mobile
    ? [{ label: 'Campus navigation', items: visibleNavigationGroups.flatMap((group) => group.items) }]
    : visibleNavigationGroups

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])
  }

  return (
    <nav aria-label="Campus navigation" className={cn(mobile ? 'w-full overflow-x-auto px-3 py-2' : 'flex-1 overflow-y-auto px-3 py-5')}>
      <div className={cn(mobile ? 'flex min-w-max gap-1' : 'flex flex-col gap-3')}>
        {groups.map((group) => {
          const expanded = mobile || expandedGroups.includes(group.label)
          return (
            <section className={mobile ? 'flex gap-1' : 'flex flex-col'} key={group.label}>
              {!mobile ? (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleGroup(group.label)}
                  className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <span>{group.label}</span>
                  <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0 transition-transform', !expanded && '-rotate-90')} />
                </button>
              ) : null}

              {expanded ? (
                <div className={cn(mobile ? 'flex gap-1' : 'flex flex-col gap-1')}>
                  {group.items.map((item) => {
                    const active = isItemActive(pathname, item.href)
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm transition-colors',
                          mobile && 'whitespace-nowrap px-3 py-2',
                          active
                            ? 'border-[#f0d9d5] bg-[#fbf1ed] font-medium text-[#922526] shadow-[inset_3px_0_0_#922526]' 
                            : 'text-sidebar-foreground/70 hover:border-[#eee4de] hover:bg-[#faf6f2] hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        <span>{item.label}</span>
                        {item.href === '/notifications' && unreadCount > 0 ? (
                          <Badge className="ml-auto border-0 bg-sidebar-primary px-1.5 py-0 text-[10px] text-sidebar-primary-foreground" variant="secondary">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        ) : null}
                      </Link>
                    )
                  })}

                  {!mobile && group.label === 'Departments & academics' ? (
                    <div className="mt-1">
                      <button
                        type="button"
                        aria-expanded={classesExpanded}
                        onClick={() => setClassesExpanded((value) => !value)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                          classesExpanded || pathname.startsWith('/timetable')
                            ? 'text-sidebar-foreground hover:bg-sidebar-accent/70'
                            : 'text-sidebar-foreground/70 hover:border-[#eee4de] hover:bg-[#faf6f2] hover:text-sidebar-foreground',
                        )}
                      >
                        <GraduationCap aria-hidden="true" className="size-4 shrink-0" />
                        <span className="flex-1">Classes</span>
                        <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0 transition-transform', !classesExpanded && '-rotate-90')} />
                      </button>
                      {classesExpanded ? (
                        <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-sidebar-foreground/15 pl-3">
                          {classYears.map((year) => (
                            <Link
                              key={year.value}
                              href="/timetable"
                              className="rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
                            >
                              {year.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </nav>
  )
}
