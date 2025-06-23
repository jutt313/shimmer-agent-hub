
import { useState } from 'react';
import { Bell, HelpCircle, Calendar, Bot, AlertTriangle, Zap, BookOpen, Trash2, Check, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const NotificationDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllRead, deleteAllNotifications } = useNotifications();
  const { handleError } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'automation_status':
        return <Bot className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ai_agent':
        return <Zap className="w-4 h-4 text-purple-500" />;
      case 'platform_integration':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'knowledge_system':
        return <BookOpen className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    const contextMessage = getNotificationHelpMessage(notification);
    window.dispatchEvent(new CustomEvent('open-help-chat', {
      detail: { 
        message: contextMessage,
        context: `Notification: ${notification.title} - ${notification.message}`
      }
    }));
    setIsOpen(false);
  };

  const getNotificationHelpMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'automation_status':
        return `I have a question about this automation notification: "${notification.title}". Can you help me understand what this means and what I should do next?`;
      case 'error':
        return `I got this error notification: "${notification.title}". Can you help me understand what went wrong and how to fix it?`;
      case 'ai_agent':
        return `I have a question about this AI agent notification: "${notification.title}". What does this mean for my agent?`;
      case 'platform_integration':
        return `I need help with this platform integration notification: "${notification.title}". What should I do about this?`;
      case 'knowledge_system':
        return `I have a question about this knowledge system notification: "${notification.title}". Can you explain what this means?`;
      default:
        return `I need help understanding this notification: "${notification.title}". Can you explain what it means?`;
    }
  };

  const handleHelpClick = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    const contextMessage = getNotificationHelpMessage(notification);
    window.dispatchEvent(new CustomEvent('open-help-chat', {
      detail: { 
        message: contextMessage,
        context: `Notification Help: ${notification.title} - ${notification.message}`
      }
    }));
    setIsOpen(false);
  };

  const handleDeleteClick = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await deleteAllRead();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const readNotifications = notifications.filter(n => n.is_read);
  const unreadNotifications = notifications.filter(n => !n.is_read);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-red-600"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl"
        align="end"
      >
        <DropdownMenuLabel className="flex items-center justify-between p-4">
          <span className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Notifications
          </span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 h-7 px-2 rounded-lg hover:bg-blue-50"
                title="Mark all as read"
              >
                <Check className="w-3 h-3 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Delete options"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-xl">
                  {readNotifications.length > 0 && (
                    <DropdownMenuItem 
                      onClick={handleDeleteAllRead} 
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg mx-1"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete all read ({readNotifications.length})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={handleDeleteAll} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg mx-1"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Delete all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gradient-to-r from-green-200 via-blue-200 to-green-200" />
        
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <p className="font-medium">No notifications yet</p>
            <p className="text-xs mt-1 text-gray-400">You'll see automation updates and alerts here</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 cursor-pointer focus:bg-gray-50 mx-1 rounded-lg"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={`w-full p-3 rounded-lg ${!notification.is_read ? 'bg-gradient-to-r from-blue-50 to-green-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleHelpClick(notification, e)}
                        className="h-6 w-6 p-0 hover:bg-blue-100 opacity-70 hover:opacity-100 transition-opacity rounded-full"
                        title="Get help with this notification"
                      >
                        <HelpCircle className="w-3 h-3 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(notification.id, e)}
                        className="h-6 w-6 p-0 hover:bg-red-100 opacity-70 hover:opacity-100 transition-opacity rounded-full"
                        title="Delete this notification"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
