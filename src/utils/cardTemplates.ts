export interface CardTemplate {
  id: number;
  labelZh: string;
  labelEn: string;
  /** Template string with {N} placeholders. Empty string = free text. */
  template: string;
  /** Number of variable placeholders that need user input (beyond {N}) */
  userVars: string[];
  /** Which tab(s) this template is relevant for */
  tabs: ('offset' | 'interval' | 'lunar')[];
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: 0,
    labelZh: '在一起的 {N} 天',
    labelEn: '{N} days together',
    template: '在一起的 {N} 天',
    userVars: [],
    tabs: ['offset', 'interval'],
  },
  {
    id: 1,
    labelZh: '从那天到今天',
    labelEn: 'From that day to today',
    template: '从那天到今天',
    userVars: [],
    tabs: ['offset', 'interval'],
  },
  {
    id: 2,
    labelZh: '距 {事件} 还有 {N} 天',
    labelEn: '{N} days until {event}',
    template: '距 {事件} 还有 {N} 天',
    userVars: ['事件'],
    tabs: ['offset'],
  },
  {
    id: 3,
    labelZh: '来到世界的 {N} 天',
    labelEn: '{N} days in this world',
    template: '来到世界的 {N} 天',
    userVars: [],
    tabs: ['offset'],
  },
  {
    id: 4,
    labelZh: '{项目名} 启动第 {N} 天',
    labelEn: '{project} day {N}',
    template: '{项目名} 启动第 {N} 天',
    userVars: ['项目名'],
    tabs: ['offset'],
  },
];

export const FREE_TEXT_TEMPLATE_ID = 255;
export const MAX_CUSTOM_TEXT_LENGTH = 30;

export function fillTemplate(
  template: CardTemplate,
  vars: Record<string, string>,
): string {
  let text = template.template;
  for (const [key, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${key}}`, value);
  }
  return text;
}
