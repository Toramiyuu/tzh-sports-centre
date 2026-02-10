'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  User,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

interface TrialRequest {
  id: string
  name: string
  phone: string
  email: string | null
  preferredLessonType: string
  preferredDate: string | null
  preferredTime: string | null
  message: string | null
  status: string
  adminNotes: string | null
  contactedAt: string | null
  handledBy: string | null
  createdAt: string
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-[#2A76B0]/30 text-[#0a2540]' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-50 text-amber-700' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-purple-50 text-purple-700' },
  { value: 'converted', label: 'Converted', color: 'bg-green-50 text-green-700' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-accent text-muted-foreground' },
]

const lessonTypeLabels: Record<string, string> = {
  '1-to-1': '1-to-1 Private',
  '1-to-2': '1-to-2',
  '1-to-3': '1-to-3',
  '1-to-4': '1-to-4',
  'small-kids-beginners': 'Small Group Kids (Beginners)',
  'large-kids': 'Large Group Kids',
  'large-kids-intermediate': 'Large Group Kids (Intermediate)',
  'small-adult-group': 'Small Adult Group',
}

export default function TrialRequestsContent() {
  const [requests, setRequests] = useState<TrialRequest[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState<TrialRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/trial-requests?status=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('Error fetching trial requests:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/trial-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (response.ok) {
        fetchRequests()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const saveNotes = async () => {
    if (!selectedRequest) return
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/trial-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedRequest.id, adminNotes }),
      })
      if (response.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/trial-requests?id=${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchRequests()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(o => o.value === status)
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge>{status}</Badge>
    )
  }

  const totalNew = counts['new'] || 0

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end">
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusOptions.map((status) => (
          <Card
            key={status.value}
            className={`cursor-pointer transition-all ${filter === status.value ? 'ring-2 ring-[#1854d6]' : ''}`}
            onClick={() => setFilter(status.value)}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{counts[status.value] || 0}</p>
              <p className="text-sm text-muted-foreground">{status.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label} ({counts[status.value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {totalNew > 0 && (
          <Badge className="bg-red-500 text-white">{totalNew} new</Badge>
        )}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground/70" />
          <p className="mt-4 text-muted-foreground">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/70 mb-4" />
            <p className="text-muted-foreground">No trial requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground/70" />
                      <span className="font-semibold text-lg">{request.name}</span>
                      {getStatusBadge(request.status)}
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <a
                        href={`tel:${request.phone}`}
                        className="flex items-center gap-1 text-[#0a2540] hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {request.phone}
                      </a>
                      {request.email && (
                        <a
                          href={`mailto:${request.email}`}
                          className="flex items-center gap-1 text-[#0a2540] hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          {request.email}
                        </a>
                      )}
                    </div>

                    {/* Lesson Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="bg-accent text-muted-foreground px-2 py-1 rounded">
                        {lessonTypeLabels[request.preferredLessonType] || request.preferredLessonType}
                      </span>
                      {request.preferredDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(request.preferredDate), 'MMM d, yyyy')}
                        </span>
                      )}
                      {request.preferredTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {request.preferredTime}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    {request.message && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary p-3 rounded">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>{request.message}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {request.adminNotes && (
                      <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded border-l-4 border-amber-300">
                        <strong>Admin Notes:</strong> {request.adminNotes}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground/70">
                      Submitted {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                      {request.handledBy && ` • Handled by ${request.handledBy}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateStatus(request.id, value)}
                      disabled={updating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setAdminNotes(request.adminNotes || '')
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add Notes
                    </Button>

                    <a
                      href={`https://wa.me/6${request.phone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="w-full text-green-700 border-green-300">
                        <Phone className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-500 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(request.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add notes about this trial request for {selectedRequest?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add any notes about this request..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes} disabled={updating}>
              {updating ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trial request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteRequest(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
