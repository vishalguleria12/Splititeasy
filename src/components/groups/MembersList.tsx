import { GroupMember } from '@/hooks/useGroups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, UserMinus, User } from 'lucide-react';
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

interface MembersListProps {
  members: GroupMember[];
  adminId: string;
  isAdmin: boolean;
  currentUserId: string;
  onRemove: (memberId: string) => void;
}

export function MembersList({ members, adminId, isAdmin, currentUserId, onRemove }: MembersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Group Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20">
                  {member.profile?.username?.[0]?.toUpperCase() || <User className="w-4 h-4 text-primary" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {member.profile?.username || 'Unknown'}
                  {member.user_id === currentUserId && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </p>
                {member.user_id === adminId && (
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            {isAdmin && member.user_id !== adminId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <UserMinus className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove {member.profile?.username || 'this member'} from the group.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onRemove(member.id)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
