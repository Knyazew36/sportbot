export type AppAction = 'manage' | 'read' | 'create' | 'update' | 'delete'

export type AppSubject =
  | 'Organization'
  | 'Member'
  | 'Group'
  | 'Lesson'
  | 'LessonAttendance'
  | 'ScheduleRule'
  | 'Invite'
  | 'JoinRequest'
  | 'all'
