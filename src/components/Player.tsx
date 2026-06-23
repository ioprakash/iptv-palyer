import { useEffect, useRef, useState, type FC } from 'react';
import Hls, { type ErrorData } from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';
import { isMobile } from 'react-device-detect';

interface PlayerProps {
    url: string;
    type?: 'hls' | 'youtube' | 'iframe' | 'external';
}

export const Player: FC<PlayerProps> = ({ url, type = 'hls' }) => { // Accept Type
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Cleanup function for HLS
        let hls: Hls | null = null;

        // Return early if not HLS
        if (type !== 'hls' && !url.endsWith('.m3u8')) {
            return;
        }

        const video = videoRef.current;
        if (!video) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError(null);

        const initPlayer = () => {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                });
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.warn('Autoplay blocked', e));
                    setIsPlaying(true);
                });
                hls.on(Hls.Events.ERROR, (_event, data: ErrorData) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.error("fatal network error encountered, try to recover");
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.error("fatal media error encountered, try to recover");
                                hls?.recoverMediaError();
                                break;
                            default:
                                console.error("fatal error, cannot recover");
                                setError("Stream error: " + data.details);
                                hls?.destroy();
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.addEventListener('loadedmetadata', () => {
                    video.play();
                    setIsPlaying(true);
                });
            } else {
                setError("HLS is not supported in this browser.");
            }
        };

        if (url) initPlayer();

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [url, type]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMobile) {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if ((video as any).webkitEnterFullscreen) {
                (video as any).webkitEnterFullscreen();
            }
        } else {
            if (!document.fullscreenElement) video.requestFullscreen();
            else document.exitFullscreen();
        }
    };

    if (type === 'youtube') {
        // Simple Youtube Embed
        // Extract Video ID if needed, or rely on Embed URL
        let embedUrl = url;
        // eslint-disable-next-line no-useless-escape
        const ytIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (ytIdMatch) {
            embedUrl = `https://www.youtube.com/embed/${ytIdMatch[1]}?autoplay=1`;
        }

        return (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube Video"
                />
            </div>
        )
    }

    if (type === 'iframe') {
        return (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                <iframe
                    src={url}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                    title="External Stream"
                />
            </div>
        )
    }

    if (type === 'external') {
        return (
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 flex items-center justify-center p-8">
                <div className="text-center max-w-xl space-y-4">
                    <AlertCircle className="mx-auto text-blue-400" size={40} />
                    <h3 className="text-xl font-bold text-white">External Channel</h3>
                    <p className="text-gray-400">This channel must be opened on its original provider page and may require login there.</p>
                    <button
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                        className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                    >
                        Open External Channel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative group w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 text-red-500 flex-col gap-2">
                    <AlertCircle size={48} />
                    <p>{error}</p>
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                controls={isMobile}
                onClick={isMobile ? undefined : togglePlay}
            />

            {/* Controls Overlay - Hide on mobile */}
            {!isMobile && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-4 z-10">
                    <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>

                    <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                        {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>

                    <div className="flex-1" />

                    <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
                        <Maximize size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};
