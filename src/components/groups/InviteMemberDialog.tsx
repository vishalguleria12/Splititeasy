import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMemberIds: string[];
  onInvite: (userId: string) => Promise<void>;
}

interface UserProfile {
  id: string;
  username: string | null;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  existingMemberIds,
  onInvite,
}: InviteMemberDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setUsers([]);
    }
  }, [open]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user?.id || '')
        .not('username', 'is', null)
        .limit(10);

      if (error) throw error;
      setUsers((data || []).filter((u) => !existingMemberIds.includes(u.id)));
    } catch (error: any) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    try {
      await onInvite(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search by Username</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Enter username to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm font-medium">@{u.username}</span>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(u.id)}
                    disabled={inviting === u.id}
                  >
                    {inviting === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Invite
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No users found with that username
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              Type a username to search for users
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
