import { ElementRef } from '@angular/core';
import { ClickOutsideDirective } from './click-outside.directive';

describe('ClickOutsideDirective', () => {
  it('should create an instance', () => {
    const elRef = new ElementRef(document.createElement('div'));
    const directive = new ClickOutsideDirective(elRef);
    expect(directive).toBeTruthy();
  });
});
