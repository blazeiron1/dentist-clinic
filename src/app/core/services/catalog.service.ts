import { Injectable, signal } from '@angular/core';
import { CatalogItem } from '../models';
import { MOCK_CATALOG } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private _items = signal<CatalogItem[]>(structuredClone(MOCK_CATALOG));

  readonly items = this._items.asReadonly();

  search(query: string): CatalogItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this._items().slice(0, 10);
    return this._items()
      .filter(i => i.name.toLowerCase().includes(q))
      .slice(0, 10);
  }

  getById(id: string): CatalogItem | undefined {
    return this._items().find(i => i.id === id);
  }

  findByName(name: string): CatalogItem | undefined {
    return this._items().find(i => i.name === name);
  }
}
