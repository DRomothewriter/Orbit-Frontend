import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalsService {
  constructor() {}

  private _openCreateGroup = new BehaviorSubject<boolean>(false);
  openCreateGroup$ = this._openCreateGroup.asObservable(); 
  openCreateGroup() {
    this._openCreateGroup.next(true);
  }
  closeCreateGroup() {
    this._openCreateGroup.next(false);
  }

  private _openCalendar = new BehaviorSubject<boolean>(false);
  openCalendar$= this._openCalendar.asObservable(); 
  
  openCalendar() {
    this._openCalendar.next(true);
  }
  closeCalendar() {
    this._openCalendar.next(false);
  }

  private _openMyUser = new BehaviorSubject<boolean>(false);
  openMyUser$= this._openMyUser.asObservable(); 
  
  openMyUser() {
    this._openMyUser.next(true);
  }
  closeMyUser() {
    this._openMyUser.next(false);
  }


}
