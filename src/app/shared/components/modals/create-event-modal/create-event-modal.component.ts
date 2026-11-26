import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div
        class="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-event-title"
        (click)="$event.stopPropagation()"
      >
        <header class="modal-header">
          <div>
            <span class="modal-eyebrow">Calendario</span>
            <h3 id="create-event-title">Nuevo Evento</h3>
          </div>
          <button
            type="button"
            class="close-btn"
            (click)="close()"
            aria-label="Cerrar ventana de nuevo evento"
          >
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </header>

        <form class="modal-form" (ngSubmit)="submit()">
          <div class="form-group">
            <label for="orbit-event-title">Título</label>
            <input
              id="orbit-event-title"
              name="eventTitle"
              type="text"
              [(ngModel)]="title"
              placeholder="Cena de equipo, Reunión semanal..."
              autocomplete="off"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="orbit-event-date">Fecha y hora</label>
            <input
              id="orbit-event-date"
              name="eventDate"
              type="datetime-local"
              [(ngModel)]="date"
              required
            />
          </div>

          <footer class="actions">
            <button type="button" class="cancel-btn" (click)="close()">Cancelar</button>
            <button
              type="submit"
              class="primary-btn"
              [disabled]="!title.trim() || !date"
            >
              Crear evento
            </button>
          </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: var(--modal-backdrop);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 2000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: orbitFadeIn var(--dur-fast) var(--ease-standard);
    }

    .modal-content {
      width: 92%;
      max-width: 420px;
      background: var(--modal-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--modal-border);
      border-radius: var(--modal-radius);
      box-shadow: inset 0 1px 0 rgba(244, 240, 232, 0.08), var(--shadow-lg);
      color: var(--orbit-text-primary);
      overflow: hidden;
      animation: orbitModalIn var(--dur-base) var(--ease-out-expo);
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6) var(--space-4);
      border-bottom: 1px solid var(--orbit-border-subtle);
    }

    .modal-eyebrow {
      display: block;
      font-family: var(--orbit-font-mono);
      font-size: var(--text-micro);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--orbit-text-muted);
      margin-bottom: 2px;
    }

    h3 {
      margin: 0;
      font-family: var(--orbit-font-display);
      font-size: var(--text-h1);
      font-weight: 500;
      color: var(--orbit-text-primary);
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: var(--orbit-text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background-color var(--dur-fast) var(--ease-standard),
        color var(--dur-fast) var(--ease-standard);
    }

    .close-btn:hover {
      background: var(--orbit-bg-hover);
      color: var(--orbit-text-primary);
    }

    .close-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .modal-form {
      padding: var(--space-5) var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: var(--text-caption);
      font-weight: 500;
      color: var(--orbit-text-secondary);
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--input-border);
      background: var(--input-bg);
      color: var(--orbit-text-primary);
      font-size: var(--text-body);
      transition: border-color var(--dur-fast) var(--ease-standard),
        box-shadow var(--dur-fast) var(--ease-standard);
    }

    input::placeholder {
      color: var(--orbit-text-muted);
    }

    input:focus-visible {
      outline: none;
      border-color: var(--input-border-focus);
      box-shadow: var(--input-ring-focus);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding-top: var(--space-3);
      border-top: 1px solid var(--orbit-border-subtle);
    }

    .cancel-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--orbit-text-secondary);
      padding: 8px 14px;
      border-radius: var(--btn-radius);
      font-size: var(--text-ui);
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn:hover {
      background: var(--orbit-bg-hover);
      color: var(--orbit-text-primary);
    }

    .primary-btn {
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      border: none;
      border-radius: var(--btn-radius);
      padding: 8px 16px;
      font-size: var(--text-ui);
      font-weight: 600;
      cursor: pointer;
      transition: background-color var(--dur-fast) var(--ease-standard),
        transform var(--dur-fast) var(--ease-standard);
    }

    .primary-btn:hover:not(:disabled) {
      background: var(--btn-primary-bg-hover);
    }

    .primary-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .primary-btn:disabled {
      background: rgba(226, 218, 240, 0.08);
      color: var(--orbit-text-muted);
      cursor: not-allowed;
    }
  `]
})
export class CreateEventModalComponent {
  @Output() onCreate = new EventEmitter<{ title: string; date: string }>();
  @Output() onClose = new EventEmitter<void>();

  title = '';
  date = '';

  close() {
    this.onClose.emit();
  }

  submit() {
    if (this.title.trim() && this.date) {
      this.onCreate.emit({ title: this.title.trim(), date: this.date });
      this.close();
    }
  }
}
