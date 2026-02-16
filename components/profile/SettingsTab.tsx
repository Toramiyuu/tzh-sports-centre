'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Lock,
  Bell,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff
} from 'lucide-react'

interface UserProfile {
  id: string
  notifyBookingConfirm: boolean
  notifyBookingReminder: boolean
  notifyCancellation: boolean
  notifyLessonUpdates: boolean
}

interface SettingsTabProps {
  profile: UserProfile
  onUpdate: () => void
}

export function SettingsTab({ profile, onUpdate }: SettingsTabProps) {
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Notification state
  const [notifications, setNotifications] = useState({
    bookingConfirm: profile.notifyBookingConfirm,
    bookingReminder: profile.notifyBookingReminder,
    cancellation: profile.notifyCancellation,
    lessonUpdates: profile.notifyLessonUpdates,
  })
  const [notifLoading, setNotifLoading] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handlePasswordChange = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordError('An unexpected error occurred')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleNotificationChange = async (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value })
    setNotifLoading(true)

    try {
      await fetch('/api/profile/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      onUpdate()
    } catch (err) {
      // Revert on error
      setNotifications({ ...notifications, [key]: !value })
    } finally {
      setNotifLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError('')

    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm')
      return
    }

    setDeleteLoading(true)

    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account')
        return
      }

      // Sign out and redirect
      signOut({ callbackUrl: '/' })
    } catch (err) {
      setDeleteError('An unexpected error occurred')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card className="border border-border rounded-2xl bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5" />
            Password
          </CardTitle>
          <CardDescription className="text-muted-foreground">Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}

          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)} className="rounded-full">
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              {passwordError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-muted-foreground">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="rounded-lg border-border bg-background text-foreground"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-muted-foreground">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="rounded-lg border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border-border bg-background text-foreground"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handlePasswordChange} disabled={passwordLoading} className="bg-primary hover:bg-primary/90 text-white rounded-full">
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordError('')
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border border-border rounded-2xl bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription className="text-muted-foreground">Choose what emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Booking Confirmations</p>
              <p className="text-sm text-muted-foreground">Receive email when a booking is made</p>
            </div>
            <Switch
              checked={notifications.bookingConfirm}
              onCheckedChange={(checked) => handleNotificationChange('bookingConfirm', checked)}
              disabled={notifLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Booking Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded before your booking</p>
            </div>
            <Switch
              checked={notifications.bookingReminder}
              onCheckedChange={(checked) => handleNotificationChange('bookingReminder', checked)}
              disabled={notifLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Cancellation Notices</p>
              <p className="text-sm text-muted-foreground">Email when a booking is cancelled</p>
            </div>
            <Switch
              checked={notifications.cancellation}
              onCheckedChange={(checked) => handleNotificationChange('cancellation', checked)}
              disabled={notifLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Lesson Updates</p>
              <p className="text-sm text-muted-foreground">Updates about your training sessions</p>
            </div>
            <Switch
              checked={notifications.lessonUpdates}
              onCheckedChange={(checked) => handleNotificationChange('lessonUpdates', checked)}
              disabled={notifLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border border-red-200 rounded-2xl bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Permanently delete your account. Your booking history will be kept but anonymized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 rounded-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-red-500">
                <strong>Warning:</strong> This action cannot be undone. Your account will be permanently deleted.
              </p>

              {deleteError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {deleteError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deletePassword" className="text-muted-foreground">Enter your password to confirm</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  className="rounded-lg border-border bg-background text-foreground"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="rounded-full"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletePassword('')
                    setDeleteError('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
