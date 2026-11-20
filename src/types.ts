export type Language = 'en' | 'ur';

export type Theme = 'light' | 'dark';

export type NavTab = 'home' | 'tools' | 'settings';

export type ToolId =
  | 'udhaar-manager'
  | 'bills-reminder'
  | 'expense-tracker'
  | 'notes'
  | 'age-calculator';

export type ToolCategory = 'all' | 'utilities' | 'productivity' | 'finance';

export interface ToolDefinition {
  id: ToolId;
  category: Exclude<ToolCategory, 'all'>;
  featured: boolean;
  iconBg: string;
  iconText: string;
}
