import { Component,
    OnInit,
    OnDestroy,
    ElementRef,
    ViewChild,
    ViewChildren,
    QueryList,
    AfterViewChecked,
    Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../services/call.service';
import { SocketService } from '../../services/socket.service';
import { Peer } from '../../types/call';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ModalsService } from '../../services/modals.service';
import { Group } from '../../types/group';
import { GroupService } from '../../services/group.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
    changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-video-call',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './video-call.component.html',
    styleUrl: './video-call.component.scss',
})
export class VideoCallComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('localVideo', { static: false })
    localVideo!: ElementRef<HTMLVideoElement>;
    @ViewChildren('remoteVideo') remoteVideos!: QueryList<
        ElementRef<HTMLVideoElement>
    >;

    localStream: MediaStream | null = null;
    remotePeers: Peer[] = [];

    isAudioEnabled = true;
    isVideoEnabled = true;
    isInCall = false;
    isConnecting = false;
    viewMode: 'grid' | 'focus' = 'grid';
    focusedParticipantId = 'local';

    @Input() roomId: string = '';
    peerId = `peer-${Math.random().toString(36).substr(2, 9)}`;
    @Input() group: Group = { topic: '' };
    private subscriptions: Subscription[] = [];
    private checkSocketTimeout?: ReturnType<typeof setTimeout>;
    private registeredSocketHandlers: Array<{ event: string; handler: (...args: any[]) => void }> = [];

    constructor(
        private callService: CallService,
        private socketService: SocketService,
        private route: ActivatedRoute,
        private modalsService: ModalsService,
        private groupService: GroupService
    ) {}

    ngOnInit(): void {
        // Suscribirse al stream local
        this.subscriptions.push(
            this.callService.localStream.subscribe((stream) => {
                this.localStream = stream;
                console.log('[VideoCall] Stream local recibido:', stream);
                // Intentar asignar el stream al video
                this.updateLocalVideo();
            })
        );

        // Suscribirse a los peers remotos
        this.subscriptions.push(
            this.callService.peers.subscribe((peers) => {
                this.remotePeers = Array.from(peers.values());
                this.syncFocusAfterPeersChange();
            })
        );

        // Suscribirse al estado de la llamada
        this.subscriptions.push(
            this.callService.isInCall.subscribe((inCall) => {
                this.isInCall = inCall;
                if (inCall) {
                    this.isConnecting = false;
                }
            })
        );

        // Escuchar eventos de socket
        this.setupSocketListeners();
        if(!this.group._id || this.group._id === ''){
            this.subscriptions.push(
                this.groupService.getGroupSummary().subscribe((group:Group)=> {
                    if (group._id && group._id !== this.roomId) {
                        this.group = group;
                        this.roomId = group._id;
                        this.joinCall();
                    }
                })
            );
        }

    }

    ngOnDestroy(): void {
        if (this.checkSocketTimeout) {
            clearTimeout(this.checkSocketTimeout);
        }
        const socket = this.socketService.getSocket();
        if (socket) {
            for (const { event, handler } of this.registeredSocketHandlers) {
                socket.off(event, handler);
            }
        }
        this.registeredSocketHandlers = [];
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.leaveCall();
    }

    ngAfterViewChecked(): void {
        // Actualizar video local
        this.updateLocalVideo();

        // Actualizar los videos remotos cuando la vista cambia
        if (this.remoteVideos) {
            this.remoteVideos.forEach((videoRef) => {
                const videoElement = videoRef.nativeElement;
                const peerId = videoElement.getAttribute('data-peer-id');
                const peer = this.remotePeers.find((p) => p.id === peerId);

                if (peer) {
                    if (peer.stream) {
                        const videoTracks = peer.stream.getVideoTracks();
                        const audioTracks = peer.stream.getAudioTracks();
                        const streamChanged = videoElement.srcObject !== peer.stream;
                        
                        console.log(
                            `[VideoCall] Debug peer ${peerId}:`,
                            {
                                hasStream: !!peer.stream,
                                videoTracks: videoTracks.length,
                                audioTracks: audioTracks.length,
                                streamChanged,
                                currentSrcObject: !!videoElement.srcObject,
                                videoTrackEnabled: videoTracks[0]?.enabled,
                                audioTrackEnabled: audioTracks[0]?.enabled,
                                trackStates: videoTracks.concat(audioTracks).map(track => ({
                                    kind: track.kind,
                                    enabled: track.enabled,
                                    readyState: track.readyState
                                }))
                            }
                        );

                        if (streamChanged || !videoElement.srcObject) {
                            console.log(
                                `[VideoCall] Asignando stream a video de peer ${peerId}`
                            );
                            videoElement.srcObject = peer.stream;
                            
                            // Agregar listeners para depuración
                            videoElement.onloadedmetadata = () => {
                                console.log(`[VideoCall] Metadata cargada para peer ${peerId}`);
                            };
                            
                            videoElement.oncanplay = () => {
                                console.log(`[VideoCall] Video puede reproducirse para peer ${peerId}`);
                            };
                            
                            videoElement.onerror = (error) => {
                                console.error(`[VideoCall] Error en video de peer ${peerId}:`, error);
                            };
                        }
                    } else {
                        console.warn(`[VideoCall] Peer ${peerId} no tiene stream`);
                    }
                } else {
                    console.warn(`[VideoCall] No se encontró peer para ${peerId}`);
                }
            });
        }
    }

    /**
     * Actualiza el video local
     */
    private updateLocalVideo(): void {
        if (this.localStream && this.localVideo) {
            const videoElement = this.localVideo.nativeElement;
            if (videoElement.srcObject !== this.localStream) {
                console.log('[VideoCall] Asignando stream local al video');
                videoElement.srcObject = this.localStream;
                videoElement.muted = true;
                videoElement.volume = 0;
            }
        }
    }

    /**
     * Configurar listeners de socket.io
     */
    private setupSocketListeners(): void {
        // Esperar a que el socket esté listo
        const checkSocket = () => {
            const socket = this.socketService.getSocket();

            if (!socket) {
                console.log('[VideoCall] Esperando conexión de socket...');
                this.checkSocketTimeout = setTimeout(checkSocket, 500);
                return;
            }

            console.log('[VideoCall] Socket listo, configurando listeners');
            const register = (event: string, handler: (...args: any[]) => void) => {
                socket.on(event, handler);
                this.registeredSocketHandlers.push({ event, handler });
            };

            // Cuando te unes a la sala exitosamente
            register('callRoomJoined', async (data: any) => {
                console.log('[VideoCall] Unido a sala:', data);

                try {
                    // Inicializar device con las capabilities del router
                    await this.callService.initDevice(data.rtpCapabilities);

                    // Crear transports
                    await this.callService.createSendTransport(
                        socket,
                        this.roomId
                    );
                    await this.callService.createRecvTransport(
                        socket,
                        this.roomId
                    );

                    // Obtener stream local
                    const stream = await this.callService.getLocalStream(
                        true,
                        true
                    );

                    // Producir audio y video
                    const audioTrack = stream.getAudioTracks()[0];
                    const videoTrack = stream.getVideoTracks()[0];

                    if (audioTrack) {
                        await this.callService.produce(audioTrack, 'audio');
                    }

                    if (videoTrack) {
                        await this.callService.produce(videoTrack, 'video');
                    }

                    // Agregar peers existentes y consumir sus producers
                    console.log('[VideoCall] Peers existentes:', data.peers);
                    for (const peerData of data.peers) {
                        this.callService.addPeer(peerData.peerId);

                        // Consumir cada producer del peer existente
                        for (const producer of peerData.producers) {
                            console.log(
                                `[VideoCall] Consumiendo producer existente:`,
                                producer
                            );
                            try {
                                await this.callService.consume(
                                    socket,
                                    producer.id,
                                    producer.kind,
                                    peerData.peerId
                                );
                            } catch (error) {
                                console.error(
                                    '[VideoCall] Error consumiendo producer existente:',
                                    error
                                );
                            }
                        }
                    }

                    this.callService.setInCall(true);
                } catch (error) {
                    this.isConnecting = false;
                    console.error(
                        '[VideoCall] Error configurando llamada:',
                        error
                    );
                }
            });

            // Cuando un nuevo peer se une
            register('newPeerInCall', (data: { peerId: string }) => {
                console.log('[VideoCall] Nuevo peer:', data.peerId);
                this.callService.addPeer(data.peerId);
            });

            // Cuando un peer empieza a producir audio/video
            register('newProducer', async (data: any) => {
                console.log('[VideoCall] Nuevo producer recibido:', {
                    peerId: data.peerId,
                    producerId: data.producerId,
                    kind: data.kind
                });

                try {
                    await this.callService.consume(
                        socket,
                        data.producerId,
                        data.kind,
                        data.peerId
                    );
                    console.log(`[VideoCall] Consume completado para ${data.kind} de peer ${data.peerId}`);
                    
                    // Verificar que el peer fue actualizado correctamente
                    const peers = this.remotePeers;
                    const peer = peers.find(p => p.id === data.peerId);
                    if (peer && peer.stream) {
                        console.log(`[VideoCall] Peer ${data.peerId} tiene stream con tracks:`, {
                            video: peer.stream.getVideoTracks().length,
                            audio: peer.stream.getAudioTracks().length
                        });
                    } else {
                        console.warn(`[VideoCall] Peer ${data.peerId} no tiene stream después de consume`);
                    }
                } catch (error) {
                    console.error('[VideoCall] Error consumiendo:', error);
                }
            });

            // Cuando un peer se va
            register('peerLeftCall', (data: { peerId: string }) => {
                console.log('[VideoCall] Peer se fue:', data.peerId);
                this.callService.removePeer(data.peerId);
                this.syncFocusAfterPeersChange();
            });

            // Errores
            register('callError', (data: any) => {
                this.isConnecting = false;
                console.error('[VideoCall] Error:', data);
                alert('Error en la llamada: ' + data.message);
            });
        };

        checkSocket();
    }

    /**
     * Unirse a la llamada
     */
    async joinCall(): Promise<void> {
        try {
            const socket = this.socketService.getSocket();

            if (!socket) {
                console.error(
                    '[VideoCall] Socket no disponible. Asegúrate de estar autenticado.'
                );
                alert(
                    'No se puede conectar. Por favor, inicia sesión primero.'
                );
                return;
            }
            this.isConnecting = true;
            console.log(this.roomId, this.group)
            socket.emit('joinCallRoom', {
                roomId: this.roomId,
                peerId: this.peerId,
                group: this.group
            });
        } catch (error) {
            this.isConnecting = false;
            console.error('[VideoCall] Error uniéndose a llamada:', error);
        }
    }

    /**
     * Salir de la llamada
     */
    leaveCall(): void {
        this.isConnecting = false;
        this.viewMode = 'grid';
        this.focusedParticipantId = 'local';
        if (this.isInCall || this.roomId) {
            const socket = this.socketService.getSocket();

            if (socket && this.roomId) {
                socket.emit('leaveCallRoom', {
                    roomId: this.roomId,
                    peerId: this.peerId,
                });
            }

            this.callService.cleanup();
            this.modalsService.closeCall();
        }
    }

    /**
     * Alterna entre vista cuadrícula y vista enfoque
     */
    toggleViewMode(): void {
        if (this.viewMode === 'grid') {
            this.viewMode = 'focus';
            this.syncFocusAfterPeersChange();
            if (this.focusedParticipantId === 'local' && this.remotePeers.length > 0) {
                this.focusedParticipantId = this.remotePeers[0].id;
            }
        } else {
            this.viewMode = 'grid';
        }
    }

    /**
     * Enfoca a un participante específico ('local' o peer.id)
     */
    focusParticipant(participantId: string): void {
        this.focusedParticipantId = participantId;
        this.viewMode = 'focus';
    }

    /**
     * Mantiene válido el participante enfocado cuando cambia la lista de peers
     */
    syncFocusAfterPeersChange(): void {
        if (
            this.focusedParticipantId !== 'local' &&
            !this.remotePeers.some((p) => p.id === this.focusedParticipantId)
        ) {
            this.focusedParticipantId = this.remotePeers[0]?.id ?? 'local';
        }
    }

    get focusedRemotePeer(): Peer | undefined {
        return this.remotePeers.find((p) => p.id === this.focusedParticipantId);
    }

    get filmstripRemotePeers(): Peer[] {
        return this.remotePeers.filter((p) => p.id !== this.focusedParticipantId);
    }

    get totalParticipants(): number {
        return 1 + this.remotePeers.length;
    }

    /**
     * Toggle audio (mute/unmute)
     */
    toggleAudio(): void {
        this.isAudioEnabled = this.callService.toggleAudio();
    }

    /**
     * Toggle video (on/off)
     */
    toggleVideo(): void {
        this.isVideoEnabled = this.callService.toggleVideo();
    }
}
