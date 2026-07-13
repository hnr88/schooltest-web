---
name: create-tabs
description: Create accessible tabbed interfaces using Radix UI tabs
---

# Create Tabs Component

Creates accessible tabbed interfaces using Radix UI primitives with proper ARIA support and keyboard navigation.

## Usage
```
/create-tabs [tabs-name] [--with-url-sync] [--vertical]
```

## Instructions

### 1. Basic Tabs
File: `src/modules/[module]/components/SettingsTabs.jsx`

```jsx
'use client';

import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SettingsTabs() {
  const t = useTranslations('Settings');

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">{t('tabs.general')}</TabsTrigger>
        <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
        <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('general.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* General settings form */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('security.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Security settings form */}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('notifications.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Notification settings form */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

### 2. Tabs with URL Sync
File: `src/modules/[module]/components/UserDetailsTabs.jsx`

```jsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function UserDetailsTabs({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get('tab') || 'overview';

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleTabChange = (value) => {
    router.push(`${pathname}?${createQueryString('tab', value)}`, {
      scroll: false,
    });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <UserOverview user={user} />
      </TabsContent>

      <TabsContent value="activity">
        <UserActivity userId={user.id} />
      </TabsContent>

      <TabsContent value="settings">
        <UserSettings user={user} />
      </TabsContent>
    </Tabs>
  );
}
```

### 3. Tabs with Icons
```jsx
import { User, Shield, Bell, CreditCard } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function AccountTabs() {
  return (
    <Tabs defaultValue="profile">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard className="h-4 w-4" />
          <span className="hidden sm:inline">Billing</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab contents */}
    </Tabs>
  );
}
```

### 4. Vertical Tabs (Sidebar Style)
```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function SidebarTabs() {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="flex gap-6">
      <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
        <TabsTrigger
          value="general"
          className="justify-start w-full data-[state=active]:bg-muted"
        >
          General
        </TabsTrigger>
        <TabsTrigger
          value="appearance"
          className="justify-start w-full data-[state=active]:bg-muted"
        >
          Appearance
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="justify-start w-full data-[state=active]:bg-muted"
        >
          Notifications
        </TabsTrigger>
        <TabsTrigger
          value="display"
          className="justify-start w-full data-[state=active]:bg-muted"
        >
          Display
        </TabsTrigger>
      </TabsList>

      <div className="flex-1">
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="display">
          <DisplaySettings />
        </TabsContent>
      </div>
    </Tabs>
  );
}
```

### 5. Tabs with Badge/Counter
```jsx
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function InboxTabs({ counts }) {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all" className="gap-2">
          All
          {counts.all > 0 && (
            <Badge variant="secondary" className="ml-1">
              {counts.all}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="unread" className="gap-2">
          Unread
          {counts.unread > 0 && (
            <Badge variant="destructive" className="ml-1">
              {counts.unread}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
      </TabsList>

      {/* Tab contents */}
    </Tabs>
  );
}
```

### 6. Controlled Tabs
```jsx
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function ControlledTabs({ onTabChange }) {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleValueChange = (value) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleValueChange}>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3" disabled>Tab 3 (Disabled)</TabsTrigger>
      </TabsList>

      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );
}
```

### 7. Validation Checklist
- [ ] Uses shadcn `Tabs` components
- [ ] Has `defaultValue` or controlled `value`
- [ ] TabsList wraps all TabsTriggers
- [ ] TabsContent `value` matches TabsTrigger `value`
- [ ] Translations for tab labels
- [ ] URL sync if tabs represent app state
- [ ] Icons have text labels (or sr-only)
- [ ] Disabled state for unavailable tabs

## Accessibility Features (Built-in)
- Arrow key navigation between tabs
- Home/End for first/last tab
- Automatic focus management
- Proper ARIA roles and attributes

## Do NOT
- ❌ Use buttons/links to fake tabs
- ❌ Nest tabs within tabs (use accordion)
- ❌ Forget content for each tab
- ❌ Use tabs for step-by-step wizards (use stepper)
- ❌ Hide important content in inactive tabs for SEO
