import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ModalsService } from '../../../services/modals.service';

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  color: string;
  description: string;
  participants: string[];
}

@Component({
  selector: 'app-calendar-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './calendar-modal.component.html',
  styleUrl: './calendar-modal.component.scss',
})
export class CalendarModalComponent implements OnInit {
  currentDate: Date = new Date();
  selectedDate: Date = new Date();

  events: CalendarEvent[] = [
    {
      id: 1,
      date: new Date(2025, 9, 16, 10, 30),
      title: 'Reunión de Equipo',
      color: 'teal',
      description: 'Revisión semanal de avances del proyecto.',
      participants: ['Ana', 'Carlos'],
    },
    {
      id: 2,
      date: new Date(2025, 9, 22, 18, 0),
      title: 'Entrega: Onboarding',
      color: 'orange',
      description:
        'Fecha límite para entregar el diseño del flujo de onboarding.',
      participants: ['Tú', 'Ana'],
    },
    {
      id: 3,
      date: new Date(2025, 9, 2, 14, 0),
      title: 'Llamada con Cliente',
      color: 'sky',
      description: 'Discutir feedback sobre el último prototipo.',
      participants: ['Tú', 'Cliente X'],
    },
  ];

  showCreateEventModal = false;
  showViewEventModal = false;
  selectedEvent: CalendarEvent | null = null;

  // Form data
  eventForm = {
    title: '',
    date: '',
    time: '',
    participants: '',
    description: '',
  };

  constructor(private modalsService: ModalsService){}
  ngOnInit(): void {
    this.renderCalendar();
    this.renderAgenda();
  }

  get monthYear(): string {
    return `${this.currentDate.toLocaleDateString('es-ES', {
      month: 'long',
    })} ${this.currentDate.getFullYear()}`;
  }

  get agendaDate(): string {
    return this.selectedDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  get weekDays(): string[] {
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  }

  get calendarDays(): any[] {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: any[] = [];

    // Add empty days for the beginning of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ isEmpty: true });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEvents = this.events.some(
        (e) => e.date.toDateString() === date.toDateString()
      );
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected =
        date.toDateString() === this.selectedDate.toDateString();

      days.push({
        day,
        date,
        hasEvents,
        isToday,
        isSelected,
      });
    }

    return days;
  }

  get agendaEvents(): CalendarEvent[] {
    return this.events
      .filter((e) => e.date.toDateString() === this.selectedDate.toDateString())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  prevMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.selectedDate = new Date();
  }

  selectDate(date: Date): void {
    this.selectedDate = date;
  }

  openCreateEventModal(): void {
    this.eventForm.date = this.selectedDate.toISOString().split('T')[0];
    this.showCreateEventModal = true;
  }

  closeCreateEventModal(): void {
    this.showCreateEventModal = false;
    this.resetForm();
  }

  openViewEventModal(event: CalendarEvent): void {
    this.selectedEvent = event;
    this.showViewEventModal = true;
  }

  closeViewEventModal(): void {
    this.showViewEventModal = false;
    this.selectedEvent = null;
  }

  createEvent(): void {
    if (!this.eventForm.title || !this.eventForm.date) return;

    const [year, month, day] = this.eventForm.date.split('-');
    const [hour, minute] = this.eventForm.time.split(':');

    const newEvent: CalendarEvent = {
      id: this.events.length + 1,
      date: new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour || '0'),
        parseInt(minute || '0')
      ),
      title: this.eventForm.title,
      color: 'rose',
      description: this.eventForm.description,
      participants: this.eventForm.participants
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p),
    };

    this.events.push(newEvent);
    this.closeCreateEventModal();
  }

  private resetForm(): void {
    this.eventForm = {
      title: '',
      date: '',
      time: '',
      participants: '',
      description: '',
    };
  }

  // Métodos para mantener compatibilidad con el código original
  renderCalendar(): void {
    // Implementado con getters
  }

  renderAgenda(): void {
    // Implementado con getters
  }

  toggleModal(modal: string, show: boolean): void {
    if (modal === 'create-event-modal') {
      this.showCreateEventModal = show;
    } else if (modal === 'view-event-modal') {
      this.showViewEventModal = show;
    }
  }

  viewEvent(eventId: number): void {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      this.openViewEventModal(event);
    }
  }
  getDayClasses(day: any): string {
    const baseClasses =
      'calendar-day bg-white/5 p-2 flex flex-col cursor-pointer transition-colors duration-200';
    const selectedClass = day.isSelected ? 'day-selected' : '';
    const emptyClass = day.isEmpty ? 'opacity-50' : '';

    return `${baseClasses} ${selectedClass} ${emptyClass}`.trim();
  }

  getDayNumberClasses(day: any): string {
    return day.isToday
      ? 'font-semibold bg-indigo-500 rounded-full w-7 h-7 flex items-center justify-center'
      : 'font-semibold';
  }

  closeCalendar(){
    this.modalsService.closeCalendar();
  }
}
