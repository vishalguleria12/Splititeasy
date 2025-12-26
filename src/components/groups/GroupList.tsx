import { GroupRecord } from '@/hooks/useGroups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Crown } from 'lucide-react';

interface GroupListProps {
  groups: GroupRecord[];
  userId: string;
  onSelect: (id: string) => void;
}

export function GroupList({ groups, userId, onSelect }: GroupListProps) {
  if (groups.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No groups yet. Create one to start splitting expenses!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card
          key={group.id}
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onSelect(group.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="truncate">{group.name}</span>
              {group.admin_id === userId && (
                <Badge variant="secondary" className="ml-2">
                  <Crown className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description || 'No description'}
            </p>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Badge variant="outline">{group.currency || 'USD'}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
