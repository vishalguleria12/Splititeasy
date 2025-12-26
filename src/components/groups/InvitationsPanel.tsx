import { GroupInvitation } from '@/hooks/useGroups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Check, X } from 'lucide-react';

interface InvitationsPanelProps {
  invitations: GroupInvitation[];
  onRespond: (id: string, accept: boolean) => void;
}

export function InvitationsPanel({ invitations, onRespond }: InvitationsPanelProps) {
  return (
    <Card className="mb-6 border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
              <p className="font-medium">{inv.group?.name}</p>
              <p className="text-sm text-muted-foreground">
                Invited by {inv.inviter?.username || 'Unknown'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onRespond(inv.id, false)}>
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => onRespond(inv.id, true)}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
