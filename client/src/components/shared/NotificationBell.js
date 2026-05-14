import React, { useState, useEffect } from "react";
import { Bell, X, CheckCheck, Loader2 } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../Features/NotificationSlice";

const NotificationBell = ({ userId, onNotifClick }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading } = useSelector(
    (state) => state.notifications,
  );
  const { lang } = useLanguage();

  // Fetch on mount so the unread badge is visible before opening the panel
  useEffect(() => {
    if (userId) dispatch(fetchNotifications(userId));
  }, [dispatch, userId]);

  // Re-fetch when the panel is opened to get latest
  useEffect(() => {
    if (isOpen && userId) dispatch(fetchNotifications(userId));
  }, [dispatch, isOpen, userId]);

  const markAsRead = async (notifId) => {
    try {
      await dispatch(markNotificationRead(notifId)).unwrap();
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsRead(userId)).unwrap();
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {isOpen && (
        <div
          className={`absolute top-full ${lang === "ar" ? "left-0" : "right-0"} mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h3 className="font-semibold text-sm text-foreground">
              {lang === "ar" ? "الإخطارات" : "Notifications"}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                <CheckCheck className="h-3.5 w-3.5" />
                {lang === "ar" ? "اقرأ الكل" : "Mark all read"}
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">
                  {lang === "ar" ? "لا توجد إخطارات" : "No notifications yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`px-4 py-3 text-sm border-l-2 ${
                      notif.isRead
                        ? "border-l-border bg-muted/20"
                        : "border-l-primary bg-primary/5"
                    } cursor-pointer hover:bg-muted/40 transition-colors`}
                    onClick={async () => {
                      if (!notif.isRead) await markAsRead(notif._id);
                      setIsOpen(false);
                      if (onNotifClick) onNotifClick(notif);
                    }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium leading-snug">
                          {lang === "ar"
                            ? notif.messageAr || notif.message
                            : notif.message}
                        </p>
                        {(notif.requestNumber || notif.requestId) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            #{notif.requestNumber || notif.requestId}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
