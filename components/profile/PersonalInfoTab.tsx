'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, X, Pencil, Mail, Phone, User, AlertTriangle } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  emergencyContact: string | null
  creditBalance: number
  createdAt: string
}

interface PersonalInfoTabProps {
  profile: UserProfile
  onUpdate: () => void
}

export function PersonalInfoTab({ profile, onUpdate }: PersonalInfoTabProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    emergencyContact: profile.emergencyContact || '',
  })

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      if (data.emailVerificationSent) {
        setSuccess('Profile updated. Please check your new email for a verification link.')
      } else {
        setSuccess('Profile updated successfully!')
      }

      setEditing(false)
      onUpdate()
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      emergencyContact: profile.emergencyContact || '',
    })
    setEditing(false)
    setError('')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            {success}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              Display Name
            </Label>
            {editing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              Email Address
            </Label>
            {editing ? (
              <div>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                />
                {formData.email !== profile.email && (
                  <p className="text-xs text-amber-600 mt-1">
                    Changing your email will require verification
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-900 py-2">{profile.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              Phone Number
            </Label>
            {editing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="012-345-6789"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.phone}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              Emergency Contact
            </Label>
            {editing ? (
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Name & phone number"
              />
            ) : (
              <p className="text-gray-900 py-2">
                {profile.emergencyContact || <span className="text-gray-400">Not set</span>}
              </p>
            )}
          </div>
        </div>

        {/* Member Since */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500">
            Member since {new Date(profile.createdAt).toLocaleDateString('en-MY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Action Buttons */}
        {editing && (
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
