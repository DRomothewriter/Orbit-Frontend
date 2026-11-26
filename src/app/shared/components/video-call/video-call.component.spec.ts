import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { VideoCallComponent } from './video-call.component';
import { CallService } from '../../services/call.service';
import { SocketService } from '../../services/socket.service';
import { ModalsService } from '../../services/modals.service';
import { GroupService } from '../../services/group.service';
import { Peer } from '../../types/call';

describe('VideoCallComponent', () => {
    let component: VideoCallComponent;
    let fixture: ComponentFixture<VideoCallComponent>;
    let isInCall$: BehaviorSubject<boolean>;

    beforeEach(async () => {
        isInCall$ = new BehaviorSubject<boolean>(false);

        const callServiceMock = {
            localStream: new BehaviorSubject<MediaStream | null>(null),
            peers: new BehaviorSubject<Map<string, Peer>>(new Map()),
            isInCall: isInCall$,
            cleanup: jasmine.createSpy('cleanup'),
            toggleAudio: jasmine.createSpy('toggleAudio').and.returnValue(false),
            toggleVideo: jasmine.createSpy('toggleVideo').and.returnValue(false),
        };

        const socketMock = {
            on: jasmine.createSpy('on'),
            off: jasmine.createSpy('off'),
            emit: jasmine.createSpy('emit'),
        };

        const socketServiceMock = {
            getSocket: jasmine.createSpy('getSocket').and.returnValue(socketMock),
        };

        const modalsServiceMock = {
            closeCall: jasmine.createSpy('closeCall'),
        };

        const groupServiceMock = {
            getGroupSummary: jasmine
                .createSpy('getGroupSummary')
                .and.returnValue(of({ topic: '' })),
        };

        await TestBed.configureTestingModule({
            imports: [VideoCallComponent],
            providers: [
                { provide: CallService, useValue: callServiceMock },
                { provide: SocketService, useValue: socketServiceMock },
                { provide: ActivatedRoute, useValue: {} },
                { provide: ModalsService, useValue: modalsServiceMock },
                { provide: GroupService, useValue: groupServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(VideoCallComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display cursor pointer on join button', () => {
        const joinBtn: HTMLButtonElement | null =
            fixture.nativeElement.querySelector('.btn-join');
        expect(joinBtn).not.toBeNull();
        expect(window.getComputedStyle(joinBtn!).cursor).toBe('pointer');
    });

    it('should display cursor pointer on all active call control buttons', () => {
        isInCall$.next(true);
        fixture.detectChanges();

        const controlButtons: NodeListOf<HTMLButtonElement> =
            fixture.nativeElement.querySelectorAll('.controls .control-btn');

        expect(controlButtons.length).toBeGreaterThanOrEqual(3);
        controlButtons.forEach((btn) => {
            expect(window.getComputedStyle(btn).cursor).toBe('pointer');
        });
    });

    it('should show connecting animation state while joining a call and hide it once in call', async () => {
        component.roomId = 'room-1';
        await component.joinCall();
        fixture.detectChanges();

        expect(component.isConnecting).toBeTrue();
        const connectingEl: HTMLElement | null =
            fixture.nativeElement.querySelector('.connecting-state');
        expect(connectingEl).not.toBeNull();

        isInCall$.next(true);
        fixture.detectChanges();

        expect(component.isConnecting).toBeFalse();
        expect(fixture.nativeElement.querySelector('.connecting-state')).toBeNull();
    });

    it('should toggle between grid and focus view modes', () => {
        isInCall$.next(true);
        fixture.detectChanges();

        expect(component.viewMode).toBe('grid');
        component.toggleViewMode();
        fixture.detectChanges();
        expect(component.viewMode).toBe('focus');

        component.toggleViewMode();
        fixture.detectChanges();
        expect(component.viewMode).toBe('grid');
    });

    it('should focus a selected participant and reset focus if remote peer leaves', () => {
        component.remotePeers = [
            { id: 'peer-1' } as Peer,
            { id: 'peer-2' } as Peer,
        ];
        isInCall$.next(true);
        fixture.detectChanges();

        component.focusParticipant('peer-1');
        fixture.detectChanges();
        expect(component.viewMode).toBe('focus');
        expect(component.focusedParticipantId).toBe('peer-1');

        const stageEl: HTMLElement | null =
            fixture.nativeElement.querySelector('.focus-stage');
        expect(stageEl).not.toBeNull();

        // Simulate peer leaving
        component.remotePeers = [{ id: 'peer-2' } as Peer];
        component.syncFocusAfterPeersChange();
        expect(component.focusedParticipantId).not.toBe('peer-1');
    });

    it('should allow scrolling in the video stage and preserve video aspect without cover cropping', () => {
        isInCall$.next(true);
        fixture.detectChanges();

        const stageEl: HTMLElement | null =
            fixture.nativeElement.querySelector('.video-stage');
        expect(stageEl).not.toBeNull();
        expect(window.getComputedStyle(stageEl!).overflowY).toBe('auto');

        const localVideo: HTMLVideoElement | null =
            fixture.nativeElement.querySelector('video.tile-video');
        expect(localVideo).not.toBeNull();
        expect(window.getComputedStyle(localVideo!).objectFit).toBe('contain');
    });
});
