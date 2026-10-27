import React from 'react';
import {
  LiveKitRoom,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { X, Minimize2, Maximize2 } from 'lucide-react';

function StageTracks() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: '12px',
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexWrap: 'wrap',
      height: '100%',
      padding: '4px'
    }}>
      {tracks.map((trackRef) => (
        <div
          key={trackRef.participant.identity + (trackRef.publication?.trackSid || '')}
          style={{
            width: '240px',
            height: '360px',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#1a1d29',
            flexShrink: 0
          }}
        >
          <ParticipantTile
            trackRef={trackRef}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ))}
    </div>
  );
}

export default function VideoCallArea({ liveKitUrl, token, onLeaveCall }) {
  const [isMinimized, setIsMinimized] = React.useState(false);
  if (!token) return null;

  return (
    <div style={{
      marginBottom: '16px',
      backgroundColor: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{
        backgroundColor: '#13151f',
        padding: '8px 14px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2dd4bf' }} />
          <span>Live Video Conference</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LiveKit Cloud</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={onLeaveCall} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div style={{ padding: '12px', backgroundColor: '#0c0e14', minHeight: '390px' }}>
          <LiveKitRoom
            video={true}
            audio={true}
            token={token}
            serverUrl={liveKitUrl}
            data-lk-theme="default"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <StageTracks />
            <RoomAudioRenderer />
            <ControlBar controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: false, settings: false }} />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
}