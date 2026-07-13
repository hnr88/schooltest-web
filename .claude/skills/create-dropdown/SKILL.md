---
name: create-dropdown
description: Create accessible dropdown menus using Radix UI and shadcn/ui
---

# Create Dropdown Menu

Creates accessible dropdown menus using Radix UI primitives with keyboard navigation, submenus, and various item types.

## Usage
```
/create-dropdown [dropdown-name] [--with-submenu] [--with-checkbox]
```

## Instructions

### 1. Basic Dropdown Menu
File: `src/modules/[module]/components/ActionsDropdown.jsx`

```jsx
'use client';

import { MoreHorizontal, Edit, Trash2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ActionsDropdown({ item, onEdit, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(item.id)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy ID
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`/items/${item.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in new tab
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 2. Dropdown with Submenus
File: `src/modules/[module]/components/FilterDropdown.jsx`

```jsx
'use client';

import { Filter, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusOptions = ['Active', 'Pending', 'Inactive'];
const roleOptions = ['Admin', 'User', 'Guest'];

export function FilterDropdown({ filters, onFilterChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onFilterChange('status', status)}
              >
                {filters.status === status && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                <span className={filters.status !== status ? 'pl-6' : ''}>
                  {status}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Role</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {roleOptions.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => onFilterChange('role', role)}
              >
                {filters.role === role && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                <span className={filters.role !== role ? 'pl-6' : ''}>
                  {role}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFilterChange('clear')}>
          Clear all filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Dropdown with Checkboxes
File: `src/modules/[module]/components/ColumnVisibilityDropdown.jsx`

```jsx
'use client';

import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'status', label: 'Status' },
  { id: 'role', label: 'Role' },
  { id: 'createdAt', label: 'Created' },
];

export function ColumnVisibilityDropdown({ visibleColumns, onToggle }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibleColumns.includes(column.id)}
            onCheckedChange={() => onToggle(column.id)}
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4. Dropdown with Radio Group
File: `src/modules/[module]/components/SortDropdown.jsx`

```jsx
'use client';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const sortOptions = [
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
];

export function SortDropdown({ value, onValueChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {sortOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5. User Menu Dropdown
File: `src/modules/core/components/UserMenu.jsx`

```jsx
'use client';

import { User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu({ user, onLogout }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 6. Validation Checklist
- [ ] Uses shadcn `DropdownMenu` components
- [ ] Has accessible trigger with `asChild`
- [ ] Includes `sr-only` label for icon-only triggers
- [ ] Uses proper item types (Item, CheckboxItem, RadioItem)
- [ ] Separators between logical groups
- [ ] Icons aligned with `mr-2 h-4 w-4`
- [ ] Destructive items have red text
- [ ] Keyboard shortcuts displayed if applicable
- [ ] Content aligned appropriately (start/end)

## Accessibility Features (Built-in)
- Keyboard navigation (arrows, enter, escape)
- Focus management
- ARIA attributes
- Screen reader announcements

## Do NOT
- ❌ Use native `<select>` for complex menus
- ❌ Nest interactive elements in items
- ❌ Forget screen reader labels
- ❌ Mix checkbox and radio items in same group
- ❌ Use dropdowns for navigation (use NavigationMenu)
