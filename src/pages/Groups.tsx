import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useGroups, useGroupInvitations } from '@/hooks/useGroups';
import { GroupList } from '@/components/groups/GroupList';
import { GroupDetail } from '@/components/groups/GroupDetail';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { InvitationsPanel } from '@/components/groups/InvitationsPanel';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ArrowLeft, Users } from 'lucide-react';

const Groups = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { groups, loading: groupsLoading, createGroup, deleteGroup, refetch: refetchGroups } = useGroups();
  const { invitations, respondToInvitation, refetch: refetchInvitations } = useGroupInvitations();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (authLoading || groupsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Groups - SplitItEasy</title>
        <meta name="description" content="Manage group expenses and split bills with friends." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header expenses={[]} />

        <main className="container mx-auto px-4 py-8">
          {selectedGroup ? (
            <>
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setSelectedGroupId(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Groups
              </Button>
              <GroupDetail
                group={selectedGroup}
                onDelete={() => {
                  deleteGroup(selectedGroup.id);
                  setSelectedGroupId(null);
                }}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Group Expenses
                </h1>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>

              {invitations.length > 0 && (
                <InvitationsPanel
                  invitations={invitations}
                  onRespond={async (id, accept) => {
                    await respondToInvitation(id, accept);
                    refetchGroups();
                    refetchInvitations();
                  }}
                />
              )}

              <GroupList
                groups={groups}
                userId={user.id}
                onSelect={setSelectedGroupId}
              />

              <CreateGroupDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onCreate={createGroup}
              />
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Groups;
