import type { MemberRole } from '@/lib/auth/member'

const CREATE_ROLES: MemberRole[] = [
  'admin',
  'manager',
  'nurse',
  'receptionist',
  'dentist',
  'hygienist',
]

const ALL_INCIDENTS_ROLES: MemberRole[] = [
  'admin',
  'manager',
  'viewer',
  'dentist',
  'hygienist',
]

const MANAGE_INCIDENT_ROLES: MemberRole[] = ['admin', 'manager']

export function canCreateIncident(role: MemberRole) {
  return CREATE_ROLES.includes(role)
}

export function seesAllIncidents(role: MemberRole) {
  return ALL_INCIDENTS_ROLES.includes(role)
}

export function canManageIncidents(role: MemberRole) {
  return MANAGE_INCIDENT_ROLES.includes(role)
}
