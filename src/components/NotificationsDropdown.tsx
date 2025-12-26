import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useGroupInvitations, useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, Receipt, HandCoins, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refetch: refetchNotifications } = useNotifications();
  const { respondToInvitation, refetch: refetchInvitations } = useGroupInvitations();
  const { refetch: refetchGroups } = useGroups();

  const getIcon = (type: string) => {
    switch (type) {
      case 'group_expense':
        return <Receipt className="w-4 h-4 text-primary" />;
      case 'debt_settled':
        return <HandCoins className="w-4 h-4 text-green-500" />;
      case 'group_invitation':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleRespondToInvitation = async (notificationId: string, invitationId: string, accept: boolean) => {
    await respondToInvitation(invitationId, accept);
    await deleteNotification(notificationId);
    refetchInvitations();
    refetchNotifications();
    refetchGroups();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onRespondToInvitation={handleRespondToInvitation}
                  icon={getIcon(notification.type)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRespondToInvitation: (notificationId: string, invitationId: string, accept: boolean) => void;
  icon: React.ReactNode;
}

function NotificationItem({ notification, onMarkAsRead, onDelete, onRespondToInvitation, icon }: NotificationItemProps) {
  const isInvitation = notification.type === 'group_invitation';
  const invitationId = notification.data?.invitation_id as string | undefined;

  return (
    <div
      className={`p-3 hover:bg-muted/50 transition-colors ${
        !notification.is_read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
          
          {isInvitation && invitationId && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onRespondToInvitation(notification.id, invitationId, true);
                }}
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onRespondToInvitation(notification.id, invitationId, false);
                }}
              >
                Decline
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
