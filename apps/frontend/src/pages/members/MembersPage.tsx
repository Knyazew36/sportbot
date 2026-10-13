import { useNavigate } from 'react-router'

import {
  type OrganizationMember,
  useDeleteMember,
  useOrganizationMembers,
  useUpdateMember,
} from '@/entities/organization/api'
import { ORG_ROLE_LABEL, type OrgRole, useAbility, useCurrentOrganization, useMe } from '@/entities/session'
import { toAssetUrl } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { displayName, formatDate } from '@/shared/lib/format'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { PageHeader } from '@/shared/ui/kit/PageHeader'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { SectionCard } from '@/shared/ui/kit/Section'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select'

const ROLES = (Object.keys(ORG_ROLE_LABEL) as OrgRole[]).map(value => ({ value, label: ORG_ROLE_LABEL[value] }))

const MemberRow = ({ member }: { member: OrganizationMember }) => {
  const navigate = useNavigate()
  const { orgId } = useCurrentOrganization()
  const { data: me } = useMe()
  const ability = useAbility()
  const updateMember = useUpdateMember(orgId)
  const deleteMember = useDeleteMember(orgId)

  const isMe = member.userId === me?.id
  const isOwner = member.role === 'OWNER'
  // Владельца не понизить и не исключить напрямую — только передачей владения (решает сервер)
  const canEdit = ability.can('update', 'Member') && !isOwner && !isMe
  const canRemove = ability.can('delete', 'Member') && !isOwner && (isMe || ability.can('manage', 'Member'))

  const remove = () =>
    deleteMember.mutateAsync(member.userId, {
      onSuccess: () => {
        notifySuccess(isMe ? 'Вы вышли из организации' : 'Участник исключён')()
        if (isMe) navigate(ROUTES.WORKSPACES)
      },
      onError: notifyError,
    })

  return (
    <li className='flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center'>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <PersonAvatar
          name={displayName(member)}
          src={toAssetUrl(member.avatarUrl)}
          tone={isMe ? 'accent' : 'default'}
        />
        <div className='flex min-w-0 flex-col'>
          <span className='text-body-sm truncate font-medium'>
            {displayName(member)}
            {isMe && ' (вы)'}
          </span>
          <span className='mono-label text-smoke truncate'>
            {member.email ?? '—'} · с {formatDate(member.createdAt)}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        {canEdit ? (
          <Select
            items={ROLES}
            value={member.role}
            onValueChange={role =>
              updateMember.mutate(
                { userId: member.userId, role: role as OrgRole },
                { onSuccess: notifySuccess('Роль изменена'), onError: notifyError },
              )
            }
          >
            <SelectTrigger
              aria-label='Роль'
              className='w-44 rounded-full'
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              alignItemWithTrigger={false}
              align='end'
            >
              {ROLES.map(role => (
                <SelectItem
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className='mono-label bg-mist rounded-full px-3 py-1.5'>{ORG_ROLE_LABEL[member.role]}</span>
        )}
        {canRemove && (
          <ConfirmAction
            trigger={
              <Button
                variant='destructive'
                size='sm'
              />
            }
            title={isMe ? 'Выйти из организации?' : 'Исключить участника?'}
            description={
              isMe ? 'Вернуться можно только по новому приглашению.' : `${displayName(member)} потеряет доступ.`
            }
            confirmLabel={isMe ? 'Выйти' : 'Исключить'}
            onConfirm={remove}
          >
            {isMe ? 'Выйти' : 'Исключить'}
          </ConfirmAction>
        )}
      </div>
    </li>
  )
}

const MembersPage = () => {
  const { orgId } = useCurrentOrganization()
  const members = useOrganizationMembers(orgId)

  return (
    <div className='flex flex-col gap-8'>
      <PageHeader
        eyebrow='Организация'
        title='Участники'
      />
      <QueryState
        query={members}
        isEmpty={items => items.length === 0}
      >
        {items => (
          <SectionCard count={items.length}>
            <ul className='flex flex-col'>
              {items.map(member => (
                <MemberRow
                  key={member.userId}
                  member={member}
                />
              ))}
            </ul>
          </SectionCard>
        )}
      </QueryState>
    </div>
  )
}

export default MembersPage
