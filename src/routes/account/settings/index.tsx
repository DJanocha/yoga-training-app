import { createFileRoute } from '@tanstack/react-router'
import { RedirectToSignIn, SignedIn, AuthLoading } from '@/components/auth'
import {
  UpdateAvatarCard,
  UpdateNameCard,
  ChangeEmailCard,
  ChangePasswordCard,
  SessionsCard,
  DeleteAccountCard,
} from '@daveyplate/better-auth-ui'

export const Route = createFileRoute('/account/settings/')({
  component: AccountSettings,
})

function AccountSettings() {
  return (
    <>
      <AuthLoading>
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AuthLoading>
      <RedirectToSignIn />
      <SignedIn>
        <AccountSettingsContent />
      </SignedIn>
    </>
  )
}

function AccountSettingsContent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl pb-24 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account and security</p>
      </div>

      <div className="flex flex-col gap-6">
        <UpdateAvatarCard />
        <UpdateNameCard />
        <ChangeEmailCard />
        <ChangePasswordCard />
        <SessionsCard />
        <DeleteAccountCard />
      </div>
    </div>
  )
}
