import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallService } from '../../services/call.service';
import { SocketService } from '../../services/socket.service';
import { Peer } from '../../types/call';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.component.html',
  styleUrl: './video-call.component.scss'
})
export class VideoCallComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChildren('remoteVideo') remoteVideos!: QueryList<ElementRef<HTMLVideoElement>>;
  
  localStream: MediaStream | null = null;
  remotePeers: Peer[] = [];
  
  isAudioEnabled = true;
  isVideoEnabled = true;
  isInCall = false;
  
  roomId = '';
  peerId = `peer-${Math.random().toString(36).substr(2, 9)}`;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private callService: CallService,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.roomId = this.route.snapshot.paramMap.get('roomId') || 'default-room';

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
      })
    );

    // Suscribirse al estado de la llamada
    this.subscriptions.push(
      this.callService.isInCall.subscribe((inCall) => {
        this.isInCall = inCall;
      })
    );

    // Escuchar eventos de socket
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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
        const peer = this.remotePeers.find(p => p.id === peerId);
        
        if (peer && peer.stream) {
          // Solo asignar si el stream tiene tracks de video o si cambió el stream
          const hasVideo = peer.stream.getVideoTracks().length > 0;
          const streamChanged = videoElement.srcObject !== peer.stream;
          
          if (streamChanged) {
            console.log(`[VideoCall] Asignando stream a video de peer ${peerId}`, {
              stream: peer.stream,
              videoTracks: peer.stream.getVideoTracks().length,
              audioTracks: peer.stream.getAudioTracks().length,
              hasVideo: hasVideo
            });
            videoElement.srcObject = peer.stream;
          }
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
        setTimeout(checkSocket, 500);
        return;
      }

      console.log('[VideoCall] Socket listo, configurando listeners');

      // Cuando te unes a la sala exitosamente
      socket.on('callRoomJoined', async (data: any) => {
        console.log('[VideoCall] Unido a sala:', data);
        
        try {
          // Inicializar device con las capabilities del router
          await this.callService.initDevice(data.rtpCapabilities);
          
          // Crear transports
          await this.callService.createSendTransport(socket, this.roomId);
          await this.callService.createRecvTransport(socket, this.roomId);
          
          // Obtener stream local
          const stream = await this.callService.getLocalStream(true, true);
          
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
            console.log(`[VideoCall] Consumiendo producer existente:`, producer);
            try {
              await this.callService.consume(
                socket,
                producer.id,
                producer.kind,
                peerData.peerId
              );
            } catch (error) {
              console.error('[VideoCall] Error consumiendo producer existente:', error);
            }
          }
        }
        
        this.callService.setInCall(true);
      } catch (error) {
        console.error('[VideoCall] Error configurando llamada:', error);
      }
    });

    // Cuando un nuevo peer se une
    socket.on('newPeerInCall', (data: { peerId: string }) => {
      console.log('[VideoCall] Nuevo peer:', data.peerId);
      this.callService.addPeer(data.peerId);
    });

    // Cuando un peer empieza a producir audio/video
    socket.on('newProducer', async (data: any) => {
      console.log('[VideoCall] Nuevo producer:', data);
      
      try {
        await this.callService.consume(
          socket,
          data.producerId,
          data.kind,
          data.peerId
        );
      } catch (error) {
        console.error('[VideoCall] Error consumiendo:', error);
      }
    });

    // Cuando un peer se va
    socket.on('peerLeftCall', (data: { peerId: string }) => {
      console.log('[VideoCall] Peer se fue:', data.peerId);
      this.callService.removePeer(data.peerId);
    });

    // Errores
    socket.on('callError', (data: any) => {
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
        console.error('[VideoCall] Socket no disponible. Asegúrate de estar autenticado.');
        alert('No se puede conectar. Por favor, inicia sesión primero.');
        return;
      }
      
      socket.emit('joinCallRoom', {
        roomId: this.roomId,
        peerId: this.peerId,
      });
    } catch (error) {
      console.error('[VideoCall] Error uniéndose a llamada:', error);
    }
  }

  /**
   * Salir de la llamada
   */
  leaveCall(): void {
    if (this.isInCall) {
      const socket = this.socketService.getSocket();
      
      if (socket) {
        socket.emit('leaveCallRoom', {
          roomId: this.roomId,
          peerId: this.peerId,
        });
      }
      
      this.callService.cleanup();
    }
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