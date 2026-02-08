'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Loader2, Save, X, Pencil, Mail, Phone, User, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

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

  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    emergencyContact: profile.emergencyContact || '',
  })

  const handleSave = async () => {
    setSaving(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        return
      }

      if (data.emailVerificationSent) {
        toast.success('Profile updated. Please check your new email for a verification link.', { duration: 6000 })
      } else {
        toast.success('Profile updated successfully!')
      }

      setEditing(false)
      onUpdate()
    } catch (err) {
      toast.error('An unexpected error occurred')
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
  }

  return (
    <Card className="border border-border rounded-2xl bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-full">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-muted-foreground" />
              Display Name
            </Label>
            {editing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="rounded-lg border-border bg-background text-foreground"
              />
            ) : (
              <p className="text-foreground py-2">{profile.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" />
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
                  className="rounded-lg border-border bg-background text-foreground"
                />
                {formData.email !== profile.email && (
                  <p className="text-xs text-amber-400 mt-1">
                    Changing your email will require verification
                  </p>
                )}
              </div>
            ) : (
              <p className="text-foreground py-2">{profile.email}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Phone Number
            </Label>
            {editing ? (
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            ) : (
              <p className="text-foreground py-2">{profile.phone}</p>
            )}
          </div>

          {/* Emergency Contact */}
          <div className="space-y-2">
            <Label htmlFor="emergencyContact" className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Emergency Contact
            </Label>
            {editing ? (
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="Name & phone number"
                className="rounded-lg border-border bg-background text-foreground"
              />
            ) : (
              <p className="text-foreground py-2">
                {profile.emergencyContact || <span className="text-muted-foreground">Not set</span>}
              </p>
            )}
          </div>
        </div>

        {/* Member Since */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
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
            <Button onClick={handleSave} disabled={saving} className="bg-teal-500 hover:bg-teal-400 text-white rounded-full">
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
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="rounded-full">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
