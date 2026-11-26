import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Message } from '../../../shared/types/message';
import { MessageService } from '../../../shared/services/message.service';
import { SocketService } from '../../../shared/services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, switchMap, EMPTY } from 'rxjs';
import { OrbitLoaderComponent } from '../../../shared/components/orbit-loader/orbit-loader.component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, MatIconModule, OrbitLoaderComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit, AfterViewInit, OnDestroy {
  messages: Message[] = [];
  groupId: string = '';
  currentUser: string = '';
  isLoading: boolean = false;
  showSingularity: boolean = false;
  isSingularityExiting: boolean = false;
  isRevealing: boolean = false;
  private subscriptions = new Subscription();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private rafId: number | null = null;
  private resizeObserver?: ResizeObserver;
  private stickToBottomOnLoad = false;

  @ViewChild('messagesList') messagesListRef?: ElementRef<HTMLUListElement>;
  @ViewChild('lastRef') lastRef?: ElementRef<HTMLLIElement>;

  constructor(
    private messageService: MessageService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  private clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getRevealDelay(index: number): string {
    const tailCount = 10;
    const fromEnd = this.messages.length - 1 - index;
    if (fromEnd >= tailCount) {
      return '0ms';
    }
    const order = tailCount - 1 - fromEnd;
    return `${60 + order * 34}ms`;
  }

  private applyScrollToBottom(): void {
    const listEl = this.messagesListRef?.nativeElement;
    if (listEl) {
      listEl.scrollTop = listEl.scrollHeight;
      const parentScroller = listEl.closest('.messages-chat') as HTMLElement | null;
      if (parentScroller) {
        parentScroller.scrollTop = parentScroller.scrollHeight;
      }
    } else if (this.lastRef) {
      this.lastRef.nativeElement.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }

  scrollToBottomImmediate() {
    this.applyScrollToBottom();
    if (typeof requestAnimationFrame === 'function') {
      if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this.rafId);
      }
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.applyScrollToBottom();
      });
    }
  }

  onMediaLoad(): void {
    const listEl = this.messagesListRef?.nativeElement;
    const scroller = (listEl?.closest('.messages-chat') as HTMLElement | null) ?? listEl;
    if (!scroller) return;

    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    if (this.stickToBottomOnLoad || distanceFromBottom < 140) {
      this.scrollToBottomImmediate();
    }
  }

  private appendMessageUnique(msg: Message) {
    if (msg.groupId !== this.groupId) return;
    if (msg._id && this.messages.some((m) => m._id === msg._id)) return;
    this.messages.push(msg);
    this.cdr.detectChanges();
    this.scrollToBottomImmediate();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.userService.getMyUser().subscribe((user) => {
        this.currentUser = user.username;
      })
    );

    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          switchMap((params) => {
            this.clearTimers();
            const groupId = params.get('id');
            this.groupId = groupId || '';
            this.messages = [];
            this.isSingularityExiting = false;
            this.isRevealing = false;

            if (!groupId) {
              this.isLoading = false;
              this.showSingularity = false;
              return EMPTY;
            }

            this.isLoading = true;
            this.showSingularity = true;
            return this.messageService.getGroupMessages(groupId);
          })
        )
        .subscribe({
          next: (response: Message[]) => {
            this.isLoading = false;
            this.messages = response;
            this.isSingularityExiting = true;
            this.isRevealing = true;
            this.stickToBottomOnLoad = true;
            this.cdr.detectChanges();
            this.scrollToBottomImmediate();

            this.timers.push(
              setTimeout(() => {
                this.showSingularity = false;
                this.isSingularityExiting = false;
                this.cdr.detectChanges();
              }, 440)
            );

            this.timers.push(
              setTimeout(() => {
                this.isRevealing = false;
                this.stickToBottomOnLoad = false;
                this.cdr.detectChanges();
              }, 1100)
            );
          },
          error: () => {
            this.isLoading = false;
            this.showSingularity = false;
            this.isSingularityExiting = false;
          },
        })
    );

    this.subscriptions.add(
      this.socketService.onMessage().subscribe({
        next: (response) => this.appendMessageUnique(response),
      })
    );

    if (this.messageService.sentMessage$) {
      this.subscriptions.add(
        this.messageService.sentMessage$.subscribe({
          next: (response) => this.appendMessageUnique(response),
        })
      );
    }
  }

  ngAfterViewInit(): void {
    const listEl = this.messagesListRef?.nativeElement;
    if (listEl && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.stickToBottomOnLoad) {
          this.applyScrollToBottom();
        }
      });
      this.resizeObserver.observe(listEl);
    }
    this.scrollToBottomImmediate();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.clearTimers();
    this.subscriptions.unsubscribe();
  }
}
