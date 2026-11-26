import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(targetElement: EventTarget | null): void {
    if (!targetElement) return;
    const clickedInside = this.elementRef.nativeElement.contains(
      targetElement as Node
    );
    if (!clickedInside) {
      this.appClickOutside.emit();
    }
  }
}
