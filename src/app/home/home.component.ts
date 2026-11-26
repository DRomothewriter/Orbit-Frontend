import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, RouterOutlet } from '@angular/router';

import { GroupNavComponent } from './group-nav/group-nav.component';
import { SocketService } from '../shared/services/socket.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from './header/header.component';
import { ModalsService, AvatarPreviewData, ModalAnchor } from '../shared/services/modals.service';
import { CreateGroupModalComponent } from '../shared/components/modals/create-group-modal/create-group-modal.component';
import { CreateCommunityModalComponent } from '../shared/components/modals/create-community-modal/create-community-modal.component';
import { CalendarModalComponent } from '../shared/components/modals/calendar-modal/calendar-modal.component';
import { MyuserModalComponent } from '../shared/components/modals/myuser-modal/myuser-modal.component';
import { CommunitiesNavComponent } from './communities-nav/communities-nav.component';
import { VideoCallComponent } from '../shared/components/video-call/video-call.component';
import { CommonModule } from '@angular/common';
import { Group } from '../shared/types/group';

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-home',
    standalone: true,
    imports: [
        CreateGroupModalComponent,
        CreateCommunityModalComponent,
        CalendarModalComponent,
        MyuserModalComponent,
        GroupNavComponent,
        HeaderComponent,
        RouterOutlet,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        CommunitiesNavComponent,
        VideoCallComponent,
        CommonModule,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
    isCreateGroupOpen = false;
    isCreateCommunityOpen = false;
    isCalendarOpen = false;
    isMyUserOpen = false;
    isMyUserRendered = false;
    isMyUserClosing = false;
    myUserAnchor: ModalAnchor | null = null;
    private myUserCloseTimer: ReturnType<typeof setTimeout> | null = null;
    static readonly MY_USER_EXIT_MS = 180;
    isGroupInfoOpen = false;
    isCallOpen = false;
    avatarPreview: AvatarPreviewData | null = null;

    group: Group = { topic: '' };

    static readonly MIN_MODAL_WIDTH = 360;
    static readonly MIN_MODAL_HEIGHT = 320;

    modalTop = 80;
    modalLeft = 100;
    modalWidth = 720;
    modalHeight = 500;
    modalZIndex = 1000;

    private subscriptions = new Subscription();

    isDragging = false;
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    isResizing = false;
    private resizeDirection: string = '';
    private resizeStartX = 0;
    private resizeStartY = 0;
    private startTop = 0;
    private startLeft = 0;
    private startWidth = 0;
    private startHeight = 0;

    constructor(
        private sockeService: SocketService,
        private modalsService: ModalsService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.subscriptions.add(
            this.modalsService.openCreateGroup$.subscribe(
                (val) => (this.isCreateGroupOpen = val)
            )
        );
        this.subscriptions.add(
            this.modalsService.openCreateCommunity$.subscribe(
                (val) => (this.isCreateCommunityOpen = val)
            )
        );
        this.subscriptions.add(
            this.modalsService.openCalendar$.subscribe(
                (val) => (this.isCalendarOpen = val)
            )
        );
        this.subscriptions.add(
            this.modalsService.myUserAnchor$.subscribe(
                (val) => (this.myUserAnchor = val)
            )
        );
        this.subscriptions.add(
            this.modalsService.openMyUser$.subscribe((val) => {
                this.isMyUserOpen = val;
                if (val) {
                    if (this.myUserCloseTimer) {
                        clearTimeout(this.myUserCloseTimer);
                        this.myUserCloseTimer = null;
                    }
                    this.isMyUserClosing = false;
                    this.isMyUserRendered = true;
                } else if (this.isMyUserRendered) {
                    this.isMyUserClosing = true;
                    if (this.myUserCloseTimer) {
                        clearTimeout(this.myUserCloseTimer);
                    }
                    this.myUserCloseTimer = setTimeout(() => {
                        this.isMyUserRendered = false;
                        this.isMyUserClosing = false;
                        this.myUserCloseTimer = null;
                    }, HomeComponent.MY_USER_EXIT_MS);
                }
            })
        );
        this.subscriptions.add(
            this.modalsService.openCall$.subscribe((val) => {
                this.isCallOpen = val;
                if (val) {
                    this.clampModalToViewport();
                }
            })
        );
        this.subscriptions.add(
            this.modalsService.avatarPreview$.subscribe(
                (val) => (this.avatarPreview = val)
            )
        );
        this.sockeService.connectWithGroups();

        console.log('📞 Suscribiendo al evento onCall...');
        this.subscriptions.add(
            this.sockeService.onCall().subscribe((group) => {
                console.log('🔔 Llamada recibida:', group);
                this.group = group;
                this.modalsService.openCall();
            })
        );
    }

    ngOnDestroy(): void {
        if (this.myUserCloseTimer) {
            clearTimeout(this.myUserCloseTimer);
            this.myUserCloseTimer = null;
        }
        this.subscriptions.unsubscribe();
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.stopDrag);
        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.stopResize);
    }

    navToFriends() {
        this.router.navigateByUrl('/home/friends');
    }

    startDrag(event: MouseEvent) {
        event.preventDefault?.();
        window.getSelection()?.removeAllRanges();
        this.isDragging = true;
        this.dragOffsetX = event.clientX - this.modalLeft;
        this.dragOffsetY = event.clientY - this.modalTop;
        document.addEventListener('mousemove', this.onDragMove);
        document.addEventListener('mouseup', this.stopDrag);
    }

    onDragMove = (event: MouseEvent) => {
        if (!this.isDragging) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxLeft = Math.max(0, vw - this.modalWidth);
        const maxTop = Math.max(0, vh - this.modalHeight);

        this.modalLeft = Math.max(0, Math.min(event.clientX - this.dragOffsetX, maxLeft));
        this.modalTop = Math.max(0, Math.min(event.clientY - this.dragOffsetY, maxTop));
    };

    stopDrag = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.onDragMove);
        document.removeEventListener('mouseup', this.stopDrag);
    };

    startResize(event: MouseEvent, direction: string) {
        event.preventDefault?.();
        event.stopPropagation();
        window.getSelection()?.removeAllRanges();
        this.isResizing = true;
        this.resizeDirection = direction;
        this.resizeStartX = event.clientX;
        this.resizeStartY = event.clientY;
        this.startTop = this.modalTop;
        this.startLeft = this.modalLeft;
        this.startWidth = this.modalWidth;
        this.startHeight = this.modalHeight;
        document.addEventListener('mousemove', this.onResizeMove);
        document.addEventListener('mouseup', this.stopResize);
    }

    onResizeMove = (event: MouseEvent) => {
        if (!this.isResizing) return;
        const dx = event.clientX - this.resizeStartX;
        const dy = event.clientY - this.resizeStartY;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const minW = Math.min(HomeComponent.MIN_MODAL_WIDTH, vw);
        const minH = Math.min(HomeComponent.MIN_MODAL_HEIGHT, vh);

        let newLeft = this.startLeft;
        let newTop = this.startTop;
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;

        if (this.resizeDirection.includes('left')) {
            const rightEdge = this.startLeft + this.startWidth;
            newLeft = Math.max(0, Math.min(this.startLeft + dx, rightEdge - minW));
            newWidth = rightEdge - newLeft;
        } else if (this.resizeDirection.includes('right')) {
            newWidth = Math.max(minW, Math.min(this.startWidth + dx, vw - this.startLeft));
        }

        if (this.resizeDirection.includes('top')) {
            const bottomEdge = this.startTop + this.startHeight;
            newTop = Math.max(0, Math.min(this.startTop + dy, bottomEdge - minH));
            newHeight = bottomEdge - newTop;
        } else if (this.resizeDirection.includes('bottom')) {
            newHeight = Math.max(minH, Math.min(this.startHeight + dy, vh - this.startTop));
        }

        this.modalLeft = newLeft;
        this.modalTop = newTop;
        this.modalWidth = newWidth;
        this.modalHeight = newHeight;
    };

    stopResize = () => {
        this.isResizing = false;
        document.removeEventListener('mousemove', this.onResizeMove);
        document.removeEventListener('mouseup', this.stopResize);
    };

    @HostListener('window:resize')
    onWindowResize(): void {
        this.clampModalToViewport();
    }

    private clampModalToViewport(): void {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const minW = Math.min(HomeComponent.MIN_MODAL_WIDTH, vw);
        const minH = Math.min(HomeComponent.MIN_MODAL_HEIGHT, vh);

        this.modalWidth = Math.max(minW, Math.min(this.modalWidth, vw));
        this.modalHeight = Math.max(minH, Math.min(this.modalHeight, vh));
        this.modalLeft = Math.max(0, Math.min(this.modalLeft, Math.max(0, vw - this.modalWidth)));
        this.modalTop = Math.max(0, Math.min(this.modalTop, Math.max(0, vh - this.modalHeight)));
    }

    bringToFront() {
        this.modalZIndex = Date.now();
        //Por si llegas a tener varias llamadas
    }

    closeCall() {
        this.isCallOpen = false;
        this.modalsService.closeCall();
        this.group = { topic: '' };
    }

    closeAvatarPreview() {
        this.modalsService.closeAvatarPreview();
    }

    @HostListener('document:keydown.escape')
    onEscapeKey() {
        if (this.avatarPreview) {
            this.closeAvatarPreview();
        } else if (this.isMyUserOpen) {
            this.modalsService.closeMyUser();
        }
    }
}
