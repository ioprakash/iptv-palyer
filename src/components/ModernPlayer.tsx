import { useRef, useState, useEffect, type FC } from 'react';
import Hls from 'hls.js';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
    Settings, CheckCircle2, ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { type Channel } from '../utils/m3uParser';

import { isMobile } from 'react-device-detect';

interface Props {
    channel: Channel;
    allChannels: Channel[];
    onChannelSelect: (channel: Channel) => void;
}

export const ModernPlayer: FC<Props> = ({ channel, allChannels, onChannelSelect }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Quality State
    const [qualities, setQualities] = useState<{ height: number, level: number }[]>([]);
    const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { console.log(isLoading, error, allChannels, onChannelSelect); }, [isLoading, error, allChannels, onChannelSelect]);

    // Initialize Player
    useEffect(() => {
        setIsLoading(true);
        setError('');

        // Reset Quality
        setQualities([]);
        setCurrentLevel(-1);

        if (channel.type === 'external') {
            setIsLoading(false);
            setIsPlaying(false);
            return;
        }

        if (!videoRef.current) return;

        const video = videoRef.current;

        if (Hls.isSupported() && channel.type !== 'youtube' && channel.type !== 'iframe') {
            if (hlsRef.current) hlsRef.current.destroy();

            const hls = new Hls({
                capLevelToPlayerSize: true
            });
            hlsRef.current = hls;

            hls.loadSource(channel.url);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
                const levels = data.levels.map((l, index) => ({ height: l.height, level: index }));
                // Sort by height desc
                setQualities(levels.sort((a, b) => b.height - a.height));
                setIsLoading(false);
                video.play().catch(() => { }); // Auto-play
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    setError('Stream Error');
                    setIsLoading(false);
                }
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_event, _data) => {
                // Determine actual level being played if Auto
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari Native HLS (No manual quality control usually available via JS API easily)
            video.src = channel.url;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                video.play();
            });
        } else if (channel.type === 'youtube') {
            // Handle Youtube (Ideally use an Embed component, but for now just showing placeholder)
            setError('YouTube playback requires dedicated embed');
            setIsLoading(false);
        }

        return () => {
            if (hlsRef.current) hlsRef.current.destroy();
        };
    }, [channel]);

    // Cleanup logic
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        return () => {
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
        }
    }, []);

    // Controls Visibility
    const handleMouseMove = () => {
        if (isMobile) return; // Disable custom hover controls on mobile
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    // ... (toggle functions)
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        if (isPlaying) video.pause();
        else video.play();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const changeQuality = (level: number) => {
        if (!hlsRef.current) return;
        hlsRef.current.currentLevel = level;
        setCurrentLevel(level);
        setShowQualityMenu(false);
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isMobile) {
            // Use native video fullscreen on mobile if available
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if ((video as any).webkitEnterFullscreen) {
                (video as any).webkitEnterFullscreen(); // iOS/older Android
            } else if (containerRef.current && containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            // Desktop: Container fullscreen for custom controls
            if (!containerRef.current) return;
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // ...

    return (
        <div className="flex flex-col lg:flex-row h-[100dvh] bg-[#050505] overflow-hidden">
            {/* Player Section */}
            <div className="w-full h-full relative bg-black flex flex-col justify-center" onMouseMove={handleMouseMove} ref={containerRef}>
                {/* ... (Glow and Loading) ... */}

                {channel.type === 'external' ? (
                    <div className="w-full h-full flex items-center justify-center p-6 z-10">
                        <div className="max-w-2xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 text-center shadow-2xl">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <ExternalLink size={28} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{channel.name}</h2>
                            <p className="text-gray-300 mb-2">This DishHome channel opens on DishHome Go instead of playing directly inside the IPTV player.</p>
                            <p className="text-gray-500 text-sm mb-8">DishHome protects playback behind its own authenticated site and browser restrictions, so this entry opens externally and may require an active DishHome login.</p>
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                <button
                                    onClick={() => window.open(channel.url, '_blank', 'noopener,noreferrer')}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
                                >
                                    <ExternalLink size={18} /> Open in DishHome Go
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain z-0"
                        onClick={isMobile ? undefined : togglePlay}
                        playsInline
                        controls={isMobile} // Enable native controls on mobile
                    />
                )}

                {!isMobile && channel.type !== 'external' && (
                    <div className={clsx(
                        "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-20 pb-6 px-6 z-20 transition-opacity duration-300",
                        showControls ? "opacity-100" : "opacity-0"
                    )}>
                        <div className="max-w-7xl mx-auto flex flex-col gap-4">
                            {/* Title & Badge */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-xl font-bold text-white shadow-black drop-shadow-md">{channel.name}</h1>
                                    {channel.description && <p className="text-sm text-gray-300 max-w-lg mt-1 line-clamp-1">{channel.description}</p>}
                                </div>
                                <span className="px-3 py-1 bg-red-600 rounded text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-red-600/20">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                                </span>
                            </div>

                            {/* Controls Bar */}
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button onClick={togglePlay} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all active:scale-95 group">
                                        {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current ml-1" />}
                                    </button>

                                    <div className="flex items-center gap-2 group">
                                        <button onClick={toggleMute} className="p-2 text-gray-300 hover:text-white transition-colors">
                                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                        </button>
                                        <input
                                            type="range" min="0" max="1" step="0.1"
                                            value={volume}
                                            onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; setIsMuted(v === 0); }}
                                            className="w-0 group-hover:w-24 transition-all h-1 bg-white/30 rounded-full appearance-none cursor-pointer hover:bg-blue-500 accent-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Quality Selector */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowQualityMenu(!showQualityMenu)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs font-bold border border-white/10 backdrop-blur-md transition-all"
                                        >
                                            <Settings size={14} />
                                            {currentLevel === -1 ? 'Auto' : `${qualities.find(q => q.level === currentLevel)?.height}p`}
                                        </button>

                                        {showQualityMenu && (
                                            <div className="absolute bottom-full mb-2 right-0 bg-black/90 border border-white/10 rounded-xl overflow-hidden min-w-[120px] backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-2">
                                                <button
                                                    onClick={() => changeQuality(-1)}
                                                    className={clsx("w-full text-left px-4 py-3 text-xs font-medium hover:bg-white/10 transition-colors flex justify-between", currentLevel === -1 && "text-blue-400")}
                                                >
                                                    Auto {currentLevel === -1 && <CheckCircle2 size={14} />}
                                                </button>
                                                {qualities.map(q => (
                                                    <button
                                                        key={q.level}
                                                        onClick={() => changeQuality(q.level)}
                                                        className={clsx("w-full text-left px-4 py-3 text-xs font-medium hover:bg-white/10 transition-colors flex justify-between", currentLevel === q.level && "text-blue-400")}
                                                    >
                                                        {q.height}p {currentLevel === q.level && <CheckCircle2 size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={toggleFullscreen} className="p-2 text-gray-300 hover:text-white transition-colors">
                                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}</div>
        </div>
    );
};
