// Re-exports of the read-only ui primitives — the single import surface for consumers.
// (Split from index.ts to keep the barrel under the 200-line cap.)

// forms
export { Input } from '@/components/ui/input';
export { Textarea } from '@/components/ui/textarea';
export { Label } from '@/components/ui/label';
export { Checkbox } from '@/components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
export { Switch } from '@/components/ui/switch';
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
export {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select';
export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
} from '@/components/ui/field';
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
} from '@/components/ui/input-group';

// cards
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

// feedback
export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
export { Skeleton } from '@/components/ui/skeleton';
export { Spinner } from '@/components/ui/spinner';

// avatar
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
} from '@/components/ui/avatar';

// overlays
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
export { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// data display
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
export { Separator } from '@/components/ui/separator';
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
