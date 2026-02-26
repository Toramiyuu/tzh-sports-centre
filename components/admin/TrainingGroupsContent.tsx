"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  X,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";

interface GroupMember {
  id: string;
  uid: number;
  name: string;
  phone: string;
  skillLevel: string | null;
}

interface TrainingGroup {
  id: string;
  name: string;
  sport: string;
  notes: string | null;
  members: GroupMember[];
}

export default function TrainingGroupsContent() {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TrainingGroup | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formSport, setFormSport] = useState("badminton");
  const [formNotes, setFormNotes] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );

  const [allUsers, setAllUsers] = useState<GroupMember[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/training-groups");
      const data = await res.json();
      if (res.ok) {
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      if (res.ok) {
        setAllUsers(
          (data.users || []).map(
            (u: {
              id: string;
              uid: number;
              name: string;
              phone: string;
              skillLevel: string | null;
            }) => ({
              id: u.id,
              uid: u.uid,
              name: u.name,
              phone: u.phone,
              skillLevel: u.skillLevel,
            }),
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, [fetchGroups, fetchUsers]);

  const openCreateDialog = () => {
    setEditingGroup(null);
    setFormName("");
    setFormSport("badminton");
    setFormNotes("");
    setSelectedMemberIds(new Set());
    setUserSearch("");
    setDialogOpen(true);
  };

  const openEditDialog = (group: TrainingGroup) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormSport(group.sport);
    setFormNotes(group.notes || "");
    setSelectedMemberIds(new Set(group.members.map((m) => m.id)));
    setUserSearch("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setActionLoading(true);

    try {
      const body = {
        ...(editingGroup ? { id: editingGroup.id } : {}),
        name: formName,
        sport: formSport,
        notes: formNotes,
        memberIds: Array.from(selectedMemberIds),
      };

      const res = await fetch("/api/admin/training-groups", {
        method: editingGroup ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchGroups();
      }
    } catch (error) {
      console.error("Error saving group:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/training-groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      String(u.uid).includes(userSearch),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Admin
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Training Groups
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage groups of trainees for lesson scheduling
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>

        {/* Groups List */}
        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No training groups yet.</p>
              <p className="text-sm mt-1">
                Create a group to organize trainees for lessons.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <Card key={group.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge
                        variant="secondary"
                        className="mt-1 text-xs capitalize"
                      >
                        {group.sport}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => openEditDialog(group)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-500"
                        onClick={() => setDeleteConfirmId(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {group.notes && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {group.notes}
                    </p>
                  )}
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Members ({group.members.length})
                  </div>
                  {group.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground/70">
                      No members yet
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {group.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-foreground">{member.name}</span>
                          {member.skillLevel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0"
                            >
                              {member.skillLevel}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? "Edit Group" : "Create Group"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Group Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Adult Group 1"
                />
              </div>

              <div>
                <Label>Sport</Label>
                <Select value={formSport} onValueChange={setFormSport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="badminton">Badminton</SelectItem>
                    <SelectItem value="pickleball">Pickleball</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any notes about this group..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Members ({selectedMemberIds.size} selected)</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, phone, or UID..."
                    className="pl-9"
                  />
                  {userSearch && (
                    <button
                      onClick={() => setUserSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Selected members chips */}
                {selectedMemberIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Array.from(selectedMemberIds).map((id) => {
                      const user = allUsers.find((u) => u.id === id);
                      return user ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="pr-1 gap-1"
                        >
                          {user.name}
                          <button
                            onClick={() => toggleMember(id)}
                            className="ml-0.5 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* User list */}
                <div className="mt-2 border border-border rounded-lg max-h-48 overflow-y-auto">
                  {usersLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedMemberIds.has(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => toggleMember(user.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left ${
                            isSelected ? "bg-primary/5" : ""
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-border"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-foreground">{user.name}</span>
                            <span className="text-muted-foreground ml-2">
                              #{String(user.uid)}
                            </span>
                          </div>
                          {user.skillLevel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0"
                            >
                              {user.skillLevel}
                            </Badge>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formName.trim() || actionLoading}
              >
                {actionLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingGroup ? "Save Changes" : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirmId}
          onOpenChange={() => setDeleteConfirmId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Group?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will deactivate the group. Members will not be affected.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                disabled={actionLoading}
              >
                {actionLoading && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
