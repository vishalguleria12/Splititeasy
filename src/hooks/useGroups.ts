import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface GroupRecord {
  id: string;
  name: string;
  description: string | null;
  admin_id: string;
  currency: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string | null;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string | null;
  responded_at: string | null;
  group?: GroupRecord;
  inviter?: { username: string | null };
}

export function useGroups() {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (group: { name: string; description?: string; currency?: string }) => {
    if (!user) return;

    try {
      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert([{ ...group, admin_id: user.id }])
        .select()
        .single();

      if (groupError) throw groupError;

      // Add admin as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{ group_id: groupData.id, user_id: user.id }]);

      if (memberError) throw memberError;

      setGroups((prev) => [groupData, ...prev]);
      toast.success('Group created');
      return groupData;
    } catch (error: any) {
      toast.error('Failed to create group');
      throw error;
    }
  };

  const updateGroup = async (id: string, updates: Partial<GroupRecord>) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setGroups((prev) => prev.map((g) => (g.id === id ? data : g)));
      toast.success('Group updated');
      return data;
    } catch (error: any) {
      toast.error('Failed to update group');
      throw error;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase.from('groups').delete().eq('id', id);

      if (error) throw error;
      setGroups((prev) => prev.filter((g) => g.id !== id));
      toast.success('Group deleted');
    } catch (error: any) {
      toast.error('Failed to delete group');
    }
  };

  return { groups, loading, createGroup, updateGroup, deleteGroup, refetch: fetchGroups };
}

export function useGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`*, profile:profiles(username, avatar_url)`)
        .eq('group_id', groupId);

      if (error) throw error;
      setMembers(
        (data || []).map((m: any) => ({
          ...m,
          profile: m.profile,
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();

    // Set up realtime subscription for members
    if (!groupId) return;

    const channel = supabase
      .channel(`group-members-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMembers, groupId]);

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from('group_members').delete().eq('id', memberId);

      if (error) throw error;
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('Member removed');
    } catch (error: any) {
      toast.error('Failed to remove member');
    }
  };

  return { members, loading, removeMember, refetch: fetchMembers };
}

export function useGroupInvitations() {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvitations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`*, group:groups(*), inviter:profiles!group_invitations_inviter_id_fkey(username)`)
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      setInvitations(
        (data || []).map((inv: any) => ({
          ...inv,
          group: inv.group,
          inviter: inv.inviter,
        }))
      );
    } catch (error: any) {
      console.error('Failed to load invitations', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    if (!user) return;

    try {
      // Update invitation status directly - trigger handles adding member
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({
          status: accept ? 'accepted' : 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('invitee_id', user.id);

      if (updateError) throw updateError;

      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast.success(accept ? 'Invitation accepted' : 'Invitation declined');
    } catch (error: any) {
      toast.error('Failed to respond to invitation');
    }
  };

  const sendInvitation = async (groupId: string, inviteeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('group_invitations').insert([
        {
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeId,
        },
      ]);

      if (error) throw error;
      toast.success('Invitation sent');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('User already invited');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  };

  return { invitations, loading, respondToInvitation, sendInvitation, refetch: fetchInvitations };
}
