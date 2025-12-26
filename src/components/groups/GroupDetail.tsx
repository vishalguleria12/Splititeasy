import { useState } from 'react';
import { GroupRecord, useGroupMembers, useGroupInvitations } from '@/hooks/useGroups';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MembersList } from './MembersList';
import { AddGroupExpenseDialog } from './AddGroupExpenseDialog';
import { GroupExpenseList } from './GroupExpenseList';
import { BalancesPanel } from './BalancesPanel';
import { InviteMemberDialog } from './InviteMemberDialog';
import { QuickSettleDialog } from './QuickSettleDialog';
import { SettlementHistory } from './SettlementHistory';
import { Crown, Trash2, Users, Receipt, Scale, Plus, UserPlus, Banknote, History } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GroupDetailProps {
  group: GroupRecord;
  onDelete: () => void;
}

export function GroupDetail({ group, onDelete }: GroupDetailProps) {
  const { user } = useAuth();
  const { currencies } = useCurrencies();
  const { members, removeMember, refetch: refetchMembers } = useGroupMembers(group.id);
  const { sendInvitation } = useGroupInvitations();
  const {
    expenses,
    splits,
    addExpense,
    deleteExpense,
    settleDebtBetween,
    calculateBalances,
    calculateDebts,
    getSettlementHistory,
  } = useGroupExpenses(group.id);

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const isAdmin = user?.id === group.admin_id;
  const currencySymbol = currencies.find((c) => c.code === group.currency)?.symbol || '$';

  const balances = calculateBalances(members);
  const debts = calculateDebts(members);
  const settlementHistory = getSettlementHistory();

  // Filter expenses to show only regular expenses (not settlements) in Expenses tab
  const regularExpenses = expenses.filter((e) => e.kind !== 'settlement');

  const handleInvite = async (userId: string) => {
    await sendInvitation(group.id, userId);
    setInviteOpen(false);
  };

  const handleQuickSettle = async (fromUserId: string, toUserId: string, amount?: number) => {
    await settleDebtBetween(fromUserId, toUserId, amount);
    setSettleOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {group.name}
                {isAdmin && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </CardTitle>
              {group.description && (
                <p className="text-muted-foreground mt-1">{group.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setSettleOpen(true)} variant="outline">
                <Banknote className="w-4 h-4 mr-2" />
                Settle
              </Button>
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the group and all expenses. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="outline">{group.currency || 'USD'}</Badge>
            <Badge variant="outline">{members.length} members</Badge>
            <Badge variant="outline">{regularExpenses.length} expenses</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Settlements
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddExpenseOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
          <GroupExpenseList
            expenses={regularExpenses}
            splits={splits}
            currencySymbol={currencySymbol}
            currentUserId={user?.id || ''}
            isAdmin={isAdmin}
            groupName={group.name}
            onDelete={deleteExpense}
          />
        </TabsContent>

        <TabsContent value="balances">
          <BalancesPanel
            balances={balances}
            debts={debts}
            currencySymbol={currencySymbol}
            currentUserId={user?.id || ''}
            onSettle={settleDebtBetween}
          />
        </TabsContent>

        <TabsContent value="history">
          <SettlementHistory
            settlements={settlementHistory}
            currencySymbol={currencySymbol}
            currentUserId={user?.id || ''}
            onDelete={deleteExpense}
          />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>
          )}
          <MembersList
            members={members}
            adminId={group.admin_id}
            isAdmin={isAdmin}
            currentUserId={user?.id || ''}
            onRemove={removeMember}
          />
        </TabsContent>
      </Tabs>

      <AddGroupExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        members={members}
        currency={group.currency || 'USD'}
        currencySymbol={currencySymbol}
        onAdd={addExpense}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existingMemberIds={members.map((m) => m.user_id)}
        onInvite={handleInvite}
      />

      <QuickSettleDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        members={members}
        debts={debts}
        currentUserId={user?.id || ''}
        currencySymbol={currencySymbol}
        onSettle={handleQuickSettle}
      />
    </div>
  );
}
