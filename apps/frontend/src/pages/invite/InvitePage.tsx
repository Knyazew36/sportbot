import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useInvitePreview, useRedeemInvite } from '@/entities/invite/api'
import { sessionKeys } from '@/entities/session'
import { queryClient, toAssetUrl } from '@/shared/api'
import { useIsAuthenticated } from '@/shared/auth'
import { APP_NAME } from '@/shared/config/app'
import { type AuthLocationState, buildPath, ROUTES } from '@/shared/config/paths'
import { notifyError, notifySuccess } from '@/shared/lib/notify'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Публичная страница ссылки-приглашения: превью видно до входа, вступление — после
const InvitePage = () => {
  const { token = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthenticated = useIsAuthenticated()
  const preview = useInvitePreview(token)
  const redeem = useRedeemInvite()

  // После входа вернуть сюда же — пользователь нажмёт «Вступить» уже авторизованным
  const authState: AuthLocationState = { from: location.pathname }

  const onRedeem = () =>
    redeem.mutate(token, {
      onSuccess: async result => {
        if (result.alreadyMember) {
          await queryClient.invalidateQueries({ queryKey: sessionKeys.me })
          navigate(buildPath(ROUTES.DASHBOARD, { orgId: result.organizationId }))
          return
        }
        notifySuccess('Заявка отправлена — владелец её рассмотрит')()
        navigate(ROUTES.WORKSPACES)
      },
      onError: notifyError,
    })

  return (
    <main className='bg-canvas flex min-h-svh flex-col items-center justify-center gap-8 p-4'>
      <span className='section-heading text-subheading-lg font-medium'>{APP_NAME}</span>
      <div className='w-full max-w-md'>
        <QueryState
          query={preview}
          skeleton='record'
        >
          {data => (
            <div className='rounded-card bg-card flex flex-col items-center gap-6 p-8 text-center'>
              <PersonAvatar
                name={data.ownerName}
                src={toAssetUrl(data.ownerAvatarUrl)}
                size='xl'
              />
              <div className='flex flex-col gap-2'>
                <span className='mono-label text-smoke'>{data.ownerName} приглашает в</span>
                <h1 className='section-heading text-heading-sm'>{data.organizationName}</h1>
              </div>
              {isAuthenticated ? (
                <Button
                  className='w-full'
                  disabled={redeem.isPending}
                  onClick={onRedeem}
                >
                  Вступить
                </Button>
              ) : (
                <div className='flex w-full flex-col gap-2'>
                  <Button asChild>
                    <Link
                      to={ROUTES.LOGIN}
                      state={authState}
                    >
                      Войти и вступить
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='ghost'
                  >
                    <Link
                      to={ROUTES.REGISTER}
                      state={authState}
                    >
                      Создать аккаунт
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </QueryState>
      </div>
    </main>
  )
}

export default InvitePage
