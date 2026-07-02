import { Injectable, signal } from '@angular/core';

export interface Tip {
  id: string;
  category: 'calendar' | 'patients' | 'interventions' | 'reports' | 'catalog' | 'settings' | 'general';
  title: string;
  body: string;
  icon: string;
}

const ALL_TIPS: Tip[] = [
  // Calendar
  { id: 'cal-1', category: 'calendar', icon: 'calendar_month', title: 'Креирање термин', body: 'Кликнете на празно место во календарот за да закажете нов термин. Одберете пациент и времетраење.' },
  { id: 'cal-2', category: 'calendar', icon: 'calendar_month', title: 'Промена на термин', body: 'Влечете го терминот за да го преместите на друг ден или час. Кликнете на него за детали.' },
  { id: 'cal-3', category: 'calendar', icon: 'calendar_month', title: 'Прегледи на календар', body: 'Користете ги копчињата за дневен, неделен или месечен приказ за подобра прегледност.' },

  // Patients
  { id: 'pat-1', category: 'patients', icon: 'people', title: 'Додавање пациент', body: 'Кликнете „Нов пациент" за да внесете податоци. Потребни се само име, презиме и телефон.' },
  { id: 'pat-2', category: 'patients', icon: 'people', title: 'Пребарување пациенти', body: 'Користете го полето за пребарување за брзо наоѓање по име, презиме или телефон.' },
  { id: 'pat-3', category: 'patients', icon: 'people', title: 'Здравствен картон', body: 'Во деталите на пациент може да додадете алергии, состојби и лекови за комплетен здравствен профил.' },
  { id: 'pat-4', category: 'patients', icon: 'people', title: 'Документи на пациент', body: 'Прикачете рендгенски снимки, наоди или други документи директно во картонот на пациентот.' },

  // Interventions
  { id: 'int-1', category: 'interventions', icon: 'medical_services', title: 'Додавање интервенција', body: 'Во деталите на терминот кликнете „Додај интервенција". Почнете да пишувате за автоматски предлози од каталогот.' },
  { id: 'int-2', category: 'interventions', icon: 'medical_services', title: 'Избор на заби', body: 'Кликнете на забите во дијаграмот за да означите на кои заби е извршена интервенцијата.' },
  { id: 'int-3', category: 'interventions', icon: 'medical_services', title: 'Цена од каталог', body: 'Кога одберете интервенција од каталогот, цената автоматски се пополнува од последната употреба.' },

  // Reports
  { id: 'rep-1', category: 'reports', icon: 'bar_chart', title: 'Финансиски извештаи', body: 'Прегледајте приходи, неплатени износи и број на интервенции за избран период.' },
  { id: 'rep-2', category: 'reports', icon: 'bar_chart', title: 'Период на извештај', body: 'Одберете дневен, неделен или месечен извештај за различни временски прегледи.' },

  // Catalog
  { id: 'cat-1', category: 'catalog', icon: 'auto_stories', title: 'Каталог на интервенции', body: 'Во каталогот можете да додадете, измените или избришете типови на интервенции и нивни цени.' },
  { id: 'cat-2', category: 'catalog', icon: 'auto_stories', title: 'Автоматско додавање', body: 'Кога внесувате нова интервенција во термин, таа автоматски се додава во каталогот за идна употреба.' },

  // Settings
  { id: 'set-1', category: 'settings', icon: 'settings', title: 'Бекап на податоци', body: 'Редовно правете бекап во Подесувања. Преземете го и зачувајте на надворешен диск за сигурност.' },
  { id: 'set-2', category: 'settings', icon: 'settings', title: 'Информации за клиника', body: 'Внесете ги податоците за клиниката (име, адреса, лого) - тие се прикажуваат на извештаи.' },

  // General
  { id: 'gen-1', category: 'general', icon: 'lightbulb', title: 'Брза навигација', body: 'Користете го менито лево за брз пристап до сите делови на апликацијата.' },
  { id: 'gen-2', category: 'general', icon: 'lightbulb', title: 'Помош', body: 'Посетете ја страницата Помош за детални упатства за секој дел од апликацијата.' },
];

const STORAGE_KEY = 'dental_seen_tips';
const SHOW_PROBABILITY = 0.2;

@Injectable({ providedIn: 'root' })
export class TipService {
  private seenTipIds: Set<string>;

  activeTip = signal<Tip | null>(null);

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.seenTipIds = new Set(stored ? JSON.parse(stored) : []);
  }

  getAllTips(): Tip[] {
    return ALL_TIPS;
  }

  getCategories(): { key: string; label: string; icon: string }[] {
    return [
      { key: 'calendar', label: 'Календар', icon: 'calendar_month' },
      { key: 'patients', label: 'Пациенти', icon: 'people' },
      { key: 'interventions', label: 'Интервенции', icon: 'medical_services' },
      { key: 'catalog', label: 'Каталог', icon: 'auto_stories' },
      { key: 'reports', label: 'Извештаи', icon: 'bar_chart' },
      { key: 'settings', label: 'Подесувања', icon: 'settings' },
      { key: 'general', label: 'Општо', icon: 'lightbulb' },
    ];
  }

  getTipsByCategory(category: string): Tip[] {
    return ALL_TIPS.filter(t => t.category === category);
  }

  /** Call on each navigation. Shows a random unseen tip ~20% of the time. */
  tryShowRandomTip(): void {
    if (Math.random() > SHOW_PROBABILITY) return;

    const unseen = ALL_TIPS.filter(t => !this.seenTipIds.has(t.id));
    const pool = unseen.length > 0 ? unseen : ALL_TIPS;
    const tip = pool[Math.floor(Math.random() * pool.length)];
    this.activeTip.set(tip);
  }

  dismissTip(tip: Tip): void {
    this.seenTipIds.add(tip.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.seenTipIds]));
    this.activeTip.set(null);
  }
}
