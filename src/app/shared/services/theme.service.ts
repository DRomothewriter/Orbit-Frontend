import { Injectable, signal } from '@angular/core';

export type OrbitTheme = 'dark' | 'twilight';

const STORAGE_KEY = 'orbit-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _theme = signal<OrbitTheme>(this.loadInitialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.applyTheme(this._theme());
  }

  isTwilight(): boolean {
    return this._theme() === 'twilight';
  }

  toggleTheme(): void {
    const next: OrbitTheme = this._theme() === 'dark' ? 'twilight' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: OrbitTheme): void {
    this._theme.set(theme);
    this.applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures in restricted environments
    }
  }

  private loadInitialTheme(): OrbitTheme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'twilight' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Ignore storage failures
    }
    return 'dark';
  }

  private applyTheme(theme: OrbitTheme): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
