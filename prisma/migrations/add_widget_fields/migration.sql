-- Add missing WidgetConfig fields for proactive mode, notifications, etc.
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "proactiveEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "autoOpenDelay" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "showNotification" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "notificationText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "sendGreeting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "scrollTrigger" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WidgetConfig" ADD COLUMN IF NOT EXISTS "exitIntent" BOOLEAN NOT NULL DEFAULT false;
