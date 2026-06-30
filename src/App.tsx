/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Maximize2,
  HelpCircle,
  FolderOpen,
  Volume2,
  ChevronRight,
  Flame,
  User,
  Scissors,
  Layers,
  Wand2,
  FileText,
  Sliders,
  ChevronLeft
} from "lucide-react";
import { Puppet, ControlRod, PuppetPart, Recording, RecordedFrame, PlayScript, BackdropPreset, Vec2 } from "./types";
import { createPuppetFromTemplate, TEMPLATE_DESCRIPTIONS } from "./templates";
import { computeWorldStates, updatePuppetStateOnDrag, alignRodsToPostures, initializePuppetRods } from "./puppetPhysics";

const BACKDROPS: BackdropPreset[] = [
  {
    id: "dusk",
    name: "夕阳晚照 (Golden Dusk)",
    bgGradient: "from-amber-600 via-orange-700 to-stone-900",
    ambientColor: "#f59e0b",
    candleFlickerSpeed: 3,
    silhouetteSvg: "cloud"
  },
  {
    id: "moon",
    name: "竹影月明 (Midnight Bamboo)",
    bgGradient: "from-teal-950 via-emerald-900 to-stone-950",
    ambientColor: "#0d9488",
    candleFlickerSpeed: 4,
    silhouetteSvg: "bamboo"
  },
  {
    id: "palace",
    name: "大明红宫 (Imperial Crimson)",
    bgGradient: "from-red-950 via-rose-900 to-neutral-950",
    ambientColor: "#f43f5e",
    candleFlickerSpeed: 2.5,
    silhouetteSvg: "palace"
  },
  {
    id: "river",
    name: "水墨江南 (Misty River)",
    bgGradient: "from-stone-700 via-slate-600 to-stone-900",
    ambientColor: "#a1a1aa",
    candleFlickerSpeed: 5,
    silhouetteSvg: "mountain"
  }
];

export default function App() {
  // Application State
  const [puppets, setPuppets] = useState<Puppet[]>([]);
  const [selectedPuppetId, setSelectedPuppetId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [activeBackdrop, setActiveBackdrop] = useState<BackdropPreset>(BACKDROPS[0]);
  
  // Interaction/Dragging State
  const [dragging, setDragging] = useState<{
    puppetId: string;
    rodId: string;
    offset: Vec2;
    rect: { left: number; top: number };
  } | null>(null);

  // Candle Flicker Toggle
  const [candleFlicker, setCandleFlicker] = useState(true);
  const [flickerIntensity, setFlickerIntensity] = useState(1);

  // Audio / Speech
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [currentRecordingFrames, setCurrentRecordingFrames] = useState<RecordedFrame[]>([]);
  const [savedRecordings, setSavedRecordings] = useState<Recording[]>([]);
  const [playingRecordingId, setPlayingRecordingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  // AI Script Writer State
  const [scriptTheme, setScriptTheme] = useState("武松景阳冈偶遇哮天神犬");
  const [scriptLoading, setScriptLoading] = useState(false);
  const [currentScript, setCurrentScript] = useState<PlayScript | null>(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [activeDialogIndex, setActiveDialogIndex] = useState<number | null>(null);

  // UI Tabs / Layout
  const [activeSidebarTab, setActiveSidebarTab] = useState<"library" | "edit" | "script" | "record">("library");
  const [showTutorial, setShowTutorial] = useState(true);

  // Stage Canvas Ref
  const canvasRef = useRef<SVGSVGElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize with templates
  useEffect(() => {
    // Add Wusong and Tiger by default for an engaging startup setup!
    const hero = createPuppetFromTemplate("hero", 300, 240);
    const tiger = createPuppetFromTemplate("tiger", 550, 260);
    // Orient tiger to face left
    tiger.flipX = true;
    
    // Initialize rods so they have strictly vertical alignment and sit on a horizontal baseline
    const alignedHero = initializePuppetRods(hero);
    const alignedTiger = initializePuppetRods(tiger);

    setPuppets([alignedHero, alignedTiger]);
    setSelectedPuppetId(alignedHero.id);
  }, []);

  // Candle flicker simulation
  useEffect(() => {
    if (!candleFlicker) {
      setFlickerIntensity(1);
      return;
    }

    const interval = setInterval(() => {
      // Small random variations simulating raw oil candle fires
      const rand = 0.95 + Math.random() * 0.1;
      setFlickerIntensity(rand);
    }, 120);

    return () => clearInterval(interval);
  }, [candleFlicker]);

  // Handle Dragging
  const handleMouseDown = (
    e: React.MouseEvent<SVGCircleElement> | React.TouchEvent<SVGCircleElement>,
    puppetId: string,
    rodId: string,
    handleX: number,
    handleY: number
  ) => {
    e.preventDefault();
    if (playingRecordingId !== null) return; // Prevent interference when playing recorded play
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      setDragging({
        puppetId,
        rodId,
        offset: {
          x: clickX - handleX,
          y: clickY - handleY
        },
        rect: {
          left: rect.left,
          top: rect.top
        }
      });
      setSelectedPuppetId(puppetId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!dragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - dragging.rect.left;
    const y = clientY - dragging.rect.top;

    const targetHandle = {
      x: x - dragging.offset.x,
      y: y - dragging.offset.y
    };

    setPuppets(prev =>
      prev.map(p => {
        if (p.id === dragging.puppetId) {
          return updatePuppetStateOnDrag(p, dragging.rodId, targetHandle);
        }
        return p;
      })
    );
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  // Record Frame helper
  useEffect(() => {
    if (!isRecording) return;

    const recordInterval = setInterval(() => {
      if (puppets.length === 0 || !recordingStartTime) return;
      
      // We will record the state of the active selected puppet
      const targetPuppet = puppets.find(p => p.id === selectedPuppetId);
      if (!targetPuppet) return;

      const frameAngles: { [partId: string]: number } = {};
      Object.keys(targetPuppet.parts).forEach(partId => {
        frameAngles[partId] = targetPuppet.parts[partId].angle;
      });

      const frameRods: { [rodId: string]: Vec2 } = {};
      targetPuppet.rods.forEach(rod => {
        frameRods[rod.id] = { x: rod.handleX, y: rod.handleY };
      });

      const frame: RecordedFrame = {
        timestamp: Date.now() - recordingStartTime,
        puppetX: targetPuppet.x,
        puppetY: targetPuppet.y,
        puppetDepth: targetPuppet.depth,
        puppetScale: targetPuppet.scale,
        puppetFlipX: targetPuppet.flipX,
        partAngles: frameAngles,
        rodHandles: frameRods
      };

      setCurrentRecordingFrames(prev => [...prev, frame]);
    }, 50); // 20 fps recording for lightweight precise tracking

    return () => clearInterval(recordInterval);
  }, [isRecording, puppets, selectedPuppetId, recordingStartTime]);

  const startRecording = () => {
    if (!selectedPuppetId) return;
    const activePuppet = puppets.find(p => p.id === selectedPuppetId);
    if (!activePuppet) return;

    setCurrentRecordingFrames([]);
    setRecordingStartTime(Date.now());
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (currentRecordingFrames.length === 0) return;

    const activePuppet = puppets.find(p => p.id === selectedPuppetId);
    const newRec: Recording = {
      name: `折子戏《${activePuppet?.name || "精绝古戏"}》${savedRecordings.length + 1}`,
      puppetTemplateType: activePuppet?.templateType || "hero",
      frames: [...currentRecordingFrames],
      duration: currentRecordingFrames[currentRecordingFrames.length - 1].timestamp
    };

    setSavedRecordings(prev => [...prev, newRec]);
  };

  // Animation Playback Engine
  const playAnimation = (rec: Recording, index: number) => {
    if (puppets.length === 0) return;
    setPlayingRecordingId(index);
    const playbackStartTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - playbackStartTime;
      const totalDur = rec.duration;

      if (elapsed >= totalDur) {
        setPlayingRecordingId(null);
        setPlayProgress(100);
        return;
      }

      setPlayProgress((elapsed / totalDur) * 100);

      // Find closest frame
      const frameIndex = rec.frames.findIndex(f => f.timestamp >= elapsed);
      if (frameIndex !== -1) {
        const frame = rec.frames[frameIndex];
        
        setPuppets(prev =>
          prev.map(p => {
            // Update the puppet that matches the recorded template type
            if (p.templateType === rec.puppetTemplateType) {
              const updated = { ...p };
              updated.x = frame.puppetX;
              updated.y = frame.puppetY;
              updated.depth = frame.puppetDepth;
              updated.scale = frame.puppetScale;
              updated.flipX = frame.puppetFlipX;

              // Update angles
              Object.keys(updated.parts).forEach(partId => {
                if (frame.partAngles[partId] !== undefined) {
                  updated.parts[partId].angle = frame.partAngles[partId];
                }
              });

              // Re-align control rods
              return alignRodsToPostures(updated);
            }
            return p;
          })
        );
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Call Backend to generate script
  const handleGenerateScript = async () => {
    if (!scriptTheme.trim()) return;
    setScriptLoading(true);
    setCurrentScript(null);

    const puppetNames = puppets.map(p => p.name);

    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: scriptTheme,
          puppets: puppetNames
        })
      });

      if (!res.ok) throw new Error("服务器剧本生成失败");
      const data = await res.json();
      setCurrentScript(data);
      setActiveSceneIndex(0);
      setActiveDialogIndex(null);
      setActiveSidebarTab("script");
    } catch (err: any) {
      console.error(err);
      alert("无法生成剧本，请检查后台配置或 GEMINI_API_KEY。");
    } finally {
      setScriptLoading(false);
    }
  };

  // Perform dialog triggers (TTS, screen flash)
  const handleDialogClick = (dialogIndex: number, text: string, char: string) => {
    setActiveDialogIndex(dialogIndex);

    // Dynamic gesture simulation - make active puppet bounce slightly or nod head when speaking!
    setPuppets(prev =>
      prev.map(p => {
        // Simple matching logic based on character name in script
        if (char.includes(p.name) || p.name.includes(char)) {
          const updated = { ...p };
          // Slightly nod head
          const headPart = (Object.values(updated.parts) as PuppetPart[]).find(part => part.name.includes("头"));
          if (headPart) {
            headPart.angle += 12;
            setTimeout(() => {
              setPuppets(curr =>
                curr.map(cp => {
                  if (cp.id === p.id) {
                    const r = { ...cp };
                    const hp = (Object.values(r.parts) as PuppetPart[]).find(pt => pt.name.includes("头"));
                    if (hp) hp.angle -= 12;
                    return alignRodsToPostures(r);
                  }
                  return cp;
                })
              );
            }, 300);
          }
          return alignRodsToPostures(updated);
        }
        return p;
      })
    );

    // Traditional High-Pitched Text to Speech (Chinese Operatic Vibe)
    if (ttsEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      // Higher pitch & slower speed to resemble traditional shadow show singers
      utterance.pitch = 1.35;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Add a new template puppet to stage
  const addPuppetToStage = (type: "hero" | "dog" | "dragon" | "tiger") => {
    const randomOffset = -50 + Math.random() * 100;
    const newPuppet = createPuppetFromTemplate(type, 400 + randomOffset, 250 + randomOffset);
    const aligned = initializePuppetRods(newPuppet);
    setPuppets(prev => [...prev, aligned]);
    setSelectedPuppetId(aligned.id);
    setSelectedPartId(null);
  };

  const removePuppetFromStage = (id: string) => {
    setPuppets(prev => prev.filter(p => p.id !== id));
    if (selectedPuppetId === id) {
      setSelectedPuppetId(null);
      setSelectedPartId(null);
    }
  };

  // Active puppet configurations
  const activePuppet = puppets.find(p => p.id === selectedPuppetId);

  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 font-sans flex flex-col selection:bg-amber-700 selection:text-white" id="main-root">
      
      {/* HEADER / NAVIGATION */}
      <header className="border-b border-stone-800 bg-stone-900/95 backdrop-blur px-6 py-4 flex items-center justify-between shadow-xl" id="app-header">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-red-600 p-2.5 rounded-lg shadow-inner ring-1 ring-amber-400">
            <Flame className="w-6 h-6 text-yellow-100 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-serif bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent">
              华夏影戏 · 数字化皮影工坊
            </h1>
            <p className="text-xs text-stone-400">Traditional Chinese Shadow Puppetry Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
            id="btn-tutorial"
          >
            <HelpCircle className="w-4 h-4" />
            戏班新手指南
          </button>
          
          <div className="h-6 w-px bg-stone-800" />
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-400">烛光火晕</label>
            <button
              onClick={() => setCandleFlicker(!candleFlicker)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                candleFlicker ? "bg-amber-500" : "bg-stone-800"
              }`}
              id="toggle-candle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  candleFlicker ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="app-main-content">
        
        {/* LEFT COLUMN: THEATER SCREEN & INTERACTION AREA (8 COLS) */}
        <section className="lg:col-span-8 flex flex-col gap-4" id="section-theater">
          
          {/* THEATER BOX */}
          <div className="relative border-8 border-amber-950 bg-stone-900 rounded-xl shadow-2xl overflow-hidden ring-4 ring-stone-900" id="theater-box">
            {/* Wooden Screen Header Banner */}
            <div className="bg-amber-950 px-4 py-2 flex items-center justify-between border-b border-amber-900/60 text-[10px] uppercase tracking-widest text-amber-200/80 font-serif font-bold">
              <span>東方民間皮影艺术戏台</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                后台演练中
              </span>
              <span>紙影映光 · 幻化浮生</span>
            </div>

            {/* Backdrop Filter & Screen Container */}
            <div className="relative aspect-[16/10] w-full select-none" id="stage-wrapper">
              
              {/* THE SHADOW SCREEN (羊皮纸影幕) */}
              <div
                className={`absolute inset-0 bg-gradient-to-b transition-all duration-1000 ${activeBackdrop.bgGradient} overflow-hidden`}
                style={{
                  opacity: flickerIntensity,
                  filter: candleFlicker ? `contrast(1.05) brightness(${0.95 + flickerIntensity * 0.05})` : "none"
                }}
              >
                {/* Parchment Paper Texture Overlap */}
                <div className="absolute inset-0 opacity-[0.06] mix-blend-color-burn pointer-events-none bg-[radial-gradient(#fff_25%,transparent_25%),radial-gradient(#fff_25%,transparent_25%)] [background-size:20px_20px] [background-position:0_0,10px_10px]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/10 via-transparent to-stone-950/20 opacity-80 pointer-events-none" />

                {/* Decorative Foreground Silhouette Layers */}
                {activeBackdrop.silhouetteSvg === "bamboo" && (
                  <div className="absolute inset-0 flex justify-between items-end pointer-events-none opacity-25">
                    {/* Bamboo silhouettes (SVG lines representing stalks & leaves) */}
                    <svg className="w-48 h-full fill-stone-950" viewBox="0 0 100 200">
                      <path d="M10,200 L15,0 L18,0 L13,200 Z" />
                      <path d="M10,130 Q-20,90 5,60" stroke="black" strokeWidth="2" fill="none" />
                      <path d="M13,90 Q40,60 10,40" stroke="black" strokeWidth="2" fill="none" />
                      <path d="M5,60 C-5,50 -2,40 10,42" />
                      <path d="M10,40 C20,30 18,20 5,25" />
                    </svg>
                    <svg className="w-48 h-full fill-stone-950 scale-x-[-1]" viewBox="0 0 100 200">
                      <path d="M10,200 L15,0 L18,0 L13,200 Z" />
                      <path d="M10,140 Q-20,100 5,70" stroke="black" strokeWidth="2" fill="none" />
                      <path d="M5,70 C-5,60 -2,50 10,52" />
                    </svg>
                  </div>
                )}

                {activeBackdrop.silhouetteSvg === "cloud" && (
                  <div className="absolute inset-x-0 top-4 flex justify-between px-12 pointer-events-none opacity-20">
                    <svg className="w-32 h-16 fill-amber-100" viewBox="0 0 100 50">
                      <path d="M10,40 C5,30 20,15 35,25 C45,10 65,15 75,30 C85,25 95,35 85,45 Z" />
                    </svg>
                    <svg className="w-24 h-12 fill-amber-100 scale-x-[-1]" viewBox="0 0 100 50">
                      <path d="M10,40 C5,30 20,15 35,25 C45,10 65,15 75,30 Z" />
                    </svg>
                  </div>
                )}

                {activeBackdrop.silhouetteSvg === "palace" && (
                  <div className="absolute bottom-0 inset-x-0 h-20 pointer-events-none opacity-20 bg-stone-950 flex justify-center">
                    <svg className="w-full h-full fill-stone-950" viewBox="0 0 800 100" preserveAspectRatio="none">
                      {/* Pagoda and traditional court silhouette */}
                      <path d="M 0 100 L 0 80 Q 50 60 100 80 L 150 80 L 180 40 L 210 80 L 250 80 Q 300 70 350 80 L 800 100 Z" />
                    </svg>
                  </div>
                )}

                {activeBackdrop.silhouetteSvg === "mountain" && (
                  <div className="absolute bottom-0 inset-x-0 h-28 pointer-events-none opacity-25">
                    <svg className="w-full h-full fill-stone-900" viewBox="0 0 800 120" preserveAspectRatio="none">
                      <path d="M 0 120 L 50 80 L 120 40 L 210 90 L 300 30 L 450 100 L 550 50 L 700 110 L 800 60 L 800 120 Z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* DYNAMIC SHADOW SVG VIEWER (Here is where custom mechanics render) */}
              <svg
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                onMouseLeave={handleMouseUp}
                id="svg-shadow-theater"
              >
                <defs>
                  {/* Dynamic Depth-based blur filters mimicking distance-to-light physics */}
                  <filter id="shadow-blur-0" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
                    <feColorMatrix type="matrix" values="
                      0 0 0 0 0.05
                      0 0 0 0 0.03
                      0 0 0 0 0.02
                      0 0 0 0.9 0" />
                  </filter>
                  <filter id="shadow-blur-2" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                    <feColorMatrix type="matrix" values="
                      0 0 0 0 0.08
                      0 0 0 0 0.05
                      0 0 0 0 0.04
                      0 0 0 0.85 0" />
                  </filter>
                  <filter id="shadow-blur-5" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5.5" />
                    <feColorMatrix type="matrix" values="
                      0 0 0 0 0.12
                      0 0 0 0 0.08
                      0 0 0 0 0.06
                      0 0 0 0.7 0" />
                  </filter>
                  <filter id="shadow-blur-8" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="11" />
                    <feColorMatrix type="matrix" values="
                      0 0 0 0 0.2
                      0 0 0 0 0.15
                      0 0 0 0 0.1
                      0 0 0 0.45 0" />
                  </filter>
                </defs>

                {/* BACKGROUND INSTRUCTIONS & CLUES */}
                {puppets.length === 0 && (
                  <text x="50%" y="45%" textAnchor="middle" fill="#d97706" className="text-sm font-serif italic" opacity="0.6">
                    影幕空空，请在右侧选择皮影人物登台
                  </text>
                )}

                {/* 1. RENDER PUPPET RODS AND WIRES (Rendered Behind/Overlaying based on design) */}
                {puppets.map((puppet) => {
                  const isSelected = puppet.id === selectedPuppetId;
                  return (
                    <g key={`rods-${puppet.id}`} opacity={isSelected ? 1 : 0.45}>
                      {puppet.rods.map((rod) => (
                        <g key={rod.id} className="group/rod">
                          {/* Bamboo Rod stick line */}
                          <line
                            x1={rod.worldX}
                            y1={rod.worldY}
                            x2={rod.handleX}
                            y2={rod.handleY}
                            stroke="#854d0e" // Beautiful bamboo brown stick
                            strokeWidth={2}
                            strokeDasharray="1 1"
                            opacity={0.8}
                          />
                          
                          {/* Bamboo node line detail */}
                          <line
                            x1={rod.worldX + (rod.handleX - rod.worldX) * 0.5}
                            y1={rod.worldY + (rod.handleY - rod.worldY) * 0.5}
                            x2={rod.worldX + (rod.handleX - rod.worldX) * 0.52}
                            y2={rod.worldY + (rod.handleY - rod.worldY) * 0.52}
                            stroke="#451a03"
                            strokeWidth={4}
                          />

                          {/* Wooden handle ring at the bottom */}
                          <circle
                            cx={rod.handleX}
                            cy={rod.handleY}
                            r={isSelected ? 10 : 8}
                            fill="#78350f"
                            stroke={rod.isPrimary ? "#facc15" : "#eab308"}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="cursor-grab active:cursor-grabbing hover:stroke-white hover:fill-amber-800 transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, puppet.id, rod.id, rod.handleX, rod.handleY)}
                            onTouchStart={(e) => handleMouseDown(e, puppet.id, rod.id, rod.handleX, rod.handleY)}
                            style={{ pointerEvents: "all" }}
                          />
                          {/* Inner handle ring visual hole */}
                          <circle
                            cx={rod.handleX}
                            cy={rod.handleY}
                            r={4}
                            fill="#1e1b4b"
                            opacity={0.6}
                          />
                          {/* Handle text cue */}
                          <text
                            x={rod.handleX}
                            y={rod.handleY + 22}
                            textAnchor="middle"
                            fill="#fef08a"
                            fontSize="9"
                            className="opacity-0 group-hover/rod:opacity-100 transition-opacity pointer-events-none font-serif select-none"
                          >
                            {rod.name}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}

                {/* 2. RENDER THE PHYSICAL LEATHER SHADOW PUPPETS */}
                {puppets.map((puppet) => {
                  const isSelected = puppet.id === selectedPuppetId;
                  const worldStates = computeWorldStates(puppet);

                  // Map depth state to SVG blur filter id
                  let blurFilter = "url(#shadow-blur-2)";
                  if (puppet.depth <= 1) blurFilter = "url(#shadow-blur-0)";
                  else if (puppet.depth <= 4) blurFilter = "url(#shadow-blur-2)";
                  else if (puppet.depth <= 7) blurFilter = "url(#shadow-blur-5)";
                  else blurFilter = "url(#shadow-blur-8)";

                  return (
                    <g
                      key={`puppet-${puppet.id}`}
                      filter={blurFilter}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPuppetId(puppet.id);
                        setSelectedPartId(null);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Recursively Render Puppet Parts */}
                      {Object.keys(puppet.parts).map((partId) => {
                        const part = puppet.parts[partId];
                        const state = worldStates[partId];
                        if (!state) return null;

                        const isPartSelected = partId === selectedPartId;
                        const flipX = puppet.flipX ? -1 : 1;

                        return (
                          <g
                            key={partId}
                            transform={`translate(${state.x}, ${state.y}) rotate(${state.angle}) scale(${puppet.scale})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPuppetId(puppet.id);
                              setSelectedPartId(partId);
                              setActiveSidebarTab("edit");
                            }}
                          >
                            {/* Visual Joint Pivot connection ring for clarity */}
                            {isSelected && (
                              <circle
                                cx={0}
                                cy={0}
                                r={3.5}
                                fill="#22c55e"
                                stroke="#ffffff"
                                strokeWidth="0.75"
                                opacity={0.8}
                                className="z-30 pointer-events-none"
                              />
                            )}

                            {/* Main Leather Silhouette Body with Chinese Carvings */}
                            <g transform={`scale(${flipX}, 1)`}>
                              {/* Overlay shadow parts */}
                              {part.svgPaths.map((pathStr, pIdx) => (
                                <path
                                  key={pIdx}
                                  d={pathStr}
                                  fill={part.svgFill}
                                  stroke={isPartSelected ? "#22c55e" : part.svgStroke}
                                  strokeWidth={isPartSelected ? 2.5 : (part.svgStrokeWidth || 1.2)}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  // Slightly lighter alpha for non-selected puppets to preserve depth layers
                                  fillOpacity={0.85}
                                />
                              ))}

                              {/* Decorative embedded elements (e.g. eye circles, gold embellishments) */}
                              {part.decorations && (
                                <g
                                  dangerouslySetInnerHTML={{ __html: part.decorations }}
                                  opacity={0.9}
                                />
                              )}
                            </g>

                            {/* Part Outline Hover overlay */}
                            <circle
                              cx={0}
                              cy={0}
                              r={10}
                              fill="transparent"
                              className="hover:stroke-amber-400 hover:stroke-2"
                              style={{ pointerEvents: "all" }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>

              {/* STAGE LIGHTING RECT (Warm halo from the candle) */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(15,10,5,0.7)_100%)] pointer-events-none mix-blend-multiply z-20" />
            </div>

            {/* STAGE FOOTER CONTROLS */}
            <div className="bg-stone-900 border-t border-stone-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 z-30 relative text-xs">
              
              {/* BACKDROP PRESETS SELECTOR */}
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-serif">幕布换景:</span>
                <div className="flex gap-1.5">
                  {BACKDROPS.map((bd) => (
                    <button
                      key={bd.id}
                      onClick={() => setActiveBackdrop(bd)}
                      className={`px-2.5 py-1 rounded transition border text-[11px] ${
                        activeBackdrop.id === bd.id
                          ? "bg-amber-600 text-white border-amber-400"
                          : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                      }`}
                    >
                      {bd.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* DEPTH & SCALE SLIDER FOR SELECTED PUPPET */}
              {activePuppet ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-serif">皮影进深:</span>
                    <input
                      type="range"
                      min="0"
                      max="9"
                      value={activePuppet.depth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPuppets(prev =>
                          prev.map(p => (p.id === activePuppet.id ? { ...p, depth: val } : p))
                        );
                      }}
                      className="w-24 accent-amber-500"
                    />
                    <span className="text-amber-400 w-3 font-mono">{activePuppet.depth}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-serif">缩放:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.1"
                      value={activePuppet.scale}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setPuppets(prev =>
                          prev.map(p => {
                            if (p.id === activePuppet.id) {
                              const updated = { ...p, scale: val };
                              return alignRodsToPostures(updated);
                            }
                            return p;
                          })
                        );
                      }}
                      className="w-20 accent-amber-500"
                    />
                    <span className="text-amber-400 font-mono">{activePuppet.scale.toFixed(1)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setPuppets(prev =>
                        prev.map(p => {
                          if (p.id === activePuppet.id) {
                            const updated = { ...p, flipX: !p.flipX };
                            return alignRodsToPostures(updated);
                          }
                          return p;
                        })
                      );
                    }}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 text-amber-200"
                  >
                    翻转 (Flip)
                  </button>
                </div>
              ) : (
                <span className="text-stone-500 italic font-serif">选择幕布上的人物进行高级操作</span>
              )}

            </div>
          </div>

          {/* AI PROMPT INPUT BOARD */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-lg">
            <h3 className="font-serif text-sm font-semibold mb-2.5 flex items-center gap-2 text-amber-300">
              <Wand2 className="w-4 h-4 text-amber-400" />
              AI 戏曲班主 · 传统皮影剧本创作者
            </h3>
            <p className="text-xs text-stone-400 mb-3">
              输入剧目主题，由 AI 协助您编写极具华夏古风曲艺色彩的唱词、旁白与画面调度。
            </p>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={scriptTheme}
                onChange={(e) => setScriptTheme(e.target.value)}
                placeholder="例如：祥瑞神龙和猛虎在竹林仙境守护灵芝..."
                className="flex-1 px-3.5 py-2 text-sm bg-stone-950 border border-stone-700 rounded-lg text-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                id="input-script-theme"
              />
              <button
                onClick={handleGenerateScript}
                disabled={scriptLoading}
                className="px-5 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 rounded-lg font-serif text-sm font-bold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition flex items-center gap-2 shrink-0"
                id="btn-generate-script"
              >
                {scriptLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    编唱中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    开始写戏唱词
                  </>
                )}
              </button>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: WORKSHOP SIDEBAR & TOOLS (4 COLS) */}
        <aside className="lg:col-span-4 flex flex-col gap-4" id="sidebar-workshop">
          
          {/* SIDEBAR TABS */}
          <div className="flex border-b border-stone-800 bg-stone-900 rounded-lg p-1" id="sidebar-tabs">
            <button
              onClick={() => setActiveSidebarTab("library")}
              className={`flex-1 py-2 text-xs font-serif font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                activeSidebarTab === "library"
                  ? "bg-amber-600 text-white shadow-inner"
                  : "text-stone-400 hover:text-amber-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              行头库
            </button>
            <button
              onClick={() => setActiveSidebarTab("edit")}
              className={`flex-1 py-2 text-xs font-serif font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                activeSidebarTab === "edit"
                  ? "bg-amber-600 text-white shadow-inner"
                  : "text-stone-400 hover:text-amber-200"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              关节雕刻
            </button>
            <button
              onClick={() => setActiveSidebarTab("script")}
              className={`flex-1 py-2 text-xs font-serif font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                activeSidebarTab === "script"
                  ? "bg-amber-600 text-white shadow-inner"
                  : "text-stone-400 hover:text-amber-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              皮影戏剧本
            </button>
            <button
              onClick={() => setActiveSidebarTab("record")}
              className={`flex-1 py-2 text-xs font-serif font-bold rounded-md flex items-center justify-center gap-1.5 transition ${
                activeSidebarTab === "record"
                  ? "bg-amber-600 text-white shadow-inner"
                  : "text-stone-400 hover:text-amber-200"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              戏台录制
            </button>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 min-h-[480px] shadow-lg flex flex-col justify-between" id="sidebar-content">
            
            {/* 1. LIBRARY TAB */}
            {activeSidebarTab === "library" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-serif font-bold text-amber-300 text-sm mb-1.5">登台行头 (Add Traditional Puppets)</h4>
                  <p className="text-xs text-stone-400">选择传统皮影角色模板，点击即可放入暖黄纸幕中开始操演。</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(["hero", "dog", "dragon", "tiger"] as const).map((type) => {
                    const desc = TEMPLATE_DESCRIPTIONS[type];
                    return (
                      <div
                        key={type}
                        onClick={() => addPuppetToStage(type)}
                        className="bg-stone-950 border border-stone-800 hover:border-amber-600/60 p-3 rounded-lg flex gap-3 cursor-pointer hover:bg-stone-900/60 transition group"
                      >
                        {/* Beautiful Visual Mini Thumbnail Icon */}
                        <div className="w-12 h-12 rounded bg-amber-950/40 flex items-center justify-center text-amber-500 border border-amber-900/40 shrink-0">
                          {type === "hero" && <User className="w-6 h-6" />}
                          {type === "dog" && <Sliders className="w-6 h-6 rotate-45" />}
                          {type === "dragon" && <Flame className="w-6 h-6" />}
                          {type === "tiger" && <Layers className="w-6 h-6" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-serif font-bold text-xs text-amber-200 group-hover:text-amber-400 transition">
                              {desc.name}
                            </span>
                            <span className="text-[10px] text-amber-600 font-serif">模板</span>
                          </div>
                          <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{desc.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ACTIVE PUPPETS LIST */}
                <div className="border-t border-stone-800/80 pt-4">
                  <h5 className="text-xs font-serif font-bold text-amber-300 mb-2">戏台已有行头 ({puppets.length})</h5>
                  {puppets.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">戏台上暂无影人，请在上方添加。</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {puppets.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-md text-xs border transition ${
                            p.id === selectedPuppetId
                              ? "bg-amber-950/30 border-amber-600/50"
                              : "bg-stone-950 border-stone-800 hover:bg-stone-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedPuppetId(p.id)}>
                            <div className={`w-2 h-2 rounded-full ${p.id === selectedPuppetId ? "bg-amber-400" : "bg-stone-600"}`} />
                            <span className="font-serif font-bold text-stone-200">{p.name}</span>
                          </div>
                          
                          <button
                            onClick={() => removePuppetFromStage(p.id)}
                            className="text-stone-500 hover:text-red-400 p-1 rounded"
                            title="撤下戏台"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. EDIT JOINT TAB */}
            {activeSidebarTab === "edit" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-serif font-bold text-amber-300 text-sm mb-1.5">手工关节雕刻 (Joint Customizer)</h4>
                  <p className="text-xs text-stone-400">
                    皮影由多节牛皮缀结而成。选择特定部位，可手工修剪其大小、旋转角度及装饰纹路。
                  </p>
                </div>

                {activePuppet ? (
                  <div className="flex flex-col gap-4">
                    
                    {/* Part Picker Dropdown */}
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1.5 font-serif">选定雕刻部位:</label>
                      <select
                        value={selectedPartId || ""}
                        onChange={(e) => setSelectedPartId(e.target.value || null)}
                        className="w-full bg-stone-950 text-xs text-stone-200 border border-stone-800 rounded px-2.5 py-1.5 focus:outline-none"
                      >
                        <option value="">-- 请选择关节 --</option>
                        {(Object.values(activePuppet.parts) as PuppetPart[]).map((part) => (
                          <option key={part.id} value={part.id}>
                            {part.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPartId && activePuppet.parts[selectedPartId] ? (
                      (() => {
                        const part = activePuppet.parts[selectedPartId];
                        return (
                          <div className="bg-stone-950 border border-stone-800 p-3.5 rounded-lg flex flex-col gap-4">
                            <div className="flex justify-between border-b border-stone-800/80 pb-2">
                              <span className="text-xs font-serif font-bold text-amber-200">{part.name}</span>
                              <span className="text-[10px] text-stone-500 font-mono">ID: {part.id}</span>
                            </div>

                            {/* Angle manual slider */}
                            <div>
                              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                                <span>关节旋角:</span>
                                <span className="text-amber-400 font-mono">{part.angle}°</span>
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={part.angle}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setPuppets(prev =>
                                    prev.map(p => {
                                      if (p.id === activePuppet.id) {
                                        const r = { ...p };
                                        r.parts[part.id].angle = val;
                                        return alignRodsToPostures(r);
                                      }
                                      return p;
                                    })
                                  );
                                }}
                                className="w-full accent-amber-500"
                              />
                            </div>

                            {/* Color Fill picker */}
                            <div>
                              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                                <span>染料色泽 (Leather Tint):</span>
                              </div>
                              <div className="flex gap-1.5">
                                {[
                                  "rgba(180, 50, 40, 0.75)",  // Red
                                  "rgba(35, 135, 80, 0.8)",   // Green
                                  "rgba(30, 85, 125, 0.75)",  // Blue
                                  "rgba(234, 179, 8, 0.8)",   // Yellow Gold
                                  "rgba(45, 45, 50, 0.8)",    // Charcoal
                                  "rgba(230, 195, 155, 0.8)"  // Warm Skin
                                ].map((col) => (
                                  <button
                                    key={col}
                                    onClick={() => {
                                      setPuppets(prev =>
                                        prev.map(p => {
                                          if (p.id === activePuppet.id) {
                                            const r = { ...p };
                                            r.parts[part.id].svgFill = col;
                                            return r;
                                          }
                                          return p;
                                        })
                                      );
                                    }}
                                    className="w-6 h-6 rounded-full border border-stone-800 cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: col }}
                                    title={col}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Scale modifiers for custom dimensions (Making custom designs!) */}
                            <div>
                              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                                <span>连杆身宽 (Width Custom):</span>
                                <span className="text-amber-400 font-mono">{part.width}px</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="150"
                                value={part.width}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setPuppets(prev =>
                                    prev.map(p => {
                                      if (p.id === activePuppet.id) {
                                        const r = { ...p };
                                        r.parts[part.id].width = val;
                                        return r;
                                      }
                                      return p;
                                    })
                                  );
                                }}
                                className="w-full accent-amber-500"
                              />
                            </div>

                            <button
                              onClick={() => {
                                setPuppets(prev =>
                                  prev.map(p => {
                                    if (p.id === activePuppet.id) {
                                      const r = { ...p };
                                      r.parts[part.id].angle = r.parts[part.id].defaultAngle;
                                      return alignRodsToPostures(r);
                                    }
                                    return p;
                                  })
                                );
                              }}
                              className="text-stone-400 hover:text-white text-[11px] text-center border border-stone-800 py-1 rounded hover:bg-stone-900 transition"
                            >
                              重置默认身姿
                            </button>

                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-xs text-stone-500 italic text-center py-8">
                        请在上方下拉菜单中，或直接在戏幕上点击选定任一皮影关节进行雕琢。
                      </p>
                    )}

                    {/* Puppet details */}
                    <div className="bg-stone-950 p-3 rounded border border-stone-800/60 text-[11px]">
                      <span className="text-stone-400">戏名: </span>
                      <input
                        type="text"
                        value={activePuppet.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPuppets(prev =>
                            prev.map(p => (p.id === activePuppet.id ? { ...p, name: val } : p))
                          );
                        }}
                        className="bg-transparent border-b border-stone-800 font-serif text-amber-200 ml-1 font-bold focus:outline-none"
                      />
                    </div>

                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic text-center py-8">请先选择皮影行头</p>
                )}
              </div>
            )}

            {/* 3. SCRIPT TAB */}
            {activeSidebarTab === "script" && (
              <div className="flex flex-col gap-4 h-full">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="font-serif font-bold text-amber-300 text-sm">唱词折子戏集 (Traditional Script)</h4>
                    
                    {/* TTS setting */}
                    <button
                      onClick={() => setTtsEnabled(!ttsEnabled)}
                      className={`p-1 rounded transition ${ttsEnabled ? "text-amber-400" : "text-stone-600"}`}
                      title={ttsEnabled ? "唱词吟诵开启" : "唱词吟诵关闭"}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-400">
                    这里是戏班的传世剧本。点击唱词段落，影人将点头作揖，并以传统调腔念白，助您生动合戏。
                  </p>
                </div>

                {currentScript ? (
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[380px] scrollbar-thin pr-1">
                    {/* Script Header info */}
                    <div className="bg-stone-950 p-3 rounded-lg border border-amber-950/40 text-xs">
                      <div className="font-serif font-bold text-sm text-center text-amber-400 mb-1">
                        《{currentScript.title}》
                      </div>
                      <div className="text-[10px] text-stone-400 text-center leading-relaxed font-serif">
                        推荐布景：{currentScript.backgroundDescription}
                      </div>
                    </div>

                    {/* Scene Navigation */}
                    <div className="flex gap-1 bg-stone-950 p-1 rounded border border-stone-800">
                      {currentScript.scenes.map((scene, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => {
                            setActiveSceneIndex(sIdx);
                            setActiveDialogIndex(null);
                          }}
                          className={`flex-1 py-1 text-[10px] font-serif rounded transition ${
                            activeSceneIndex === sIdx
                              ? "bg-amber-900 text-amber-100"
                              : "text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          幕 {sIdx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Active Scene Description */}
                    <div className="border-l-2 border-amber-700 pl-2.5 py-1 text-xs text-amber-100 bg-amber-950/10 italic font-serif leading-relaxed">
                      {currentScript.scenes[activeSceneIndex].narration}
                    </div>

                    {/* Dialog list */}
                    <div className="flex flex-col gap-2">
                      {currentScript.scenes[activeSceneIndex].dialogs.map((dg, dIdx) => {
                        const isActive = activeDialogIndex === dIdx;
                        return (
                          <div
                            key={dIdx}
                            onClick={() => handleDialogClick(dIdx, dg.lines, dg.character)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              isActive
                                ? "bg-amber-950/40 border-amber-500/70 text-amber-100 shadow-inner"
                                : "bg-stone-950 hover:bg-stone-900 border-stone-800/80 text-stone-300"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-serif text-amber-400/95 font-bold">
                              <span>【{dg.character}】</span>
                              <span className="text-[9px] text-stone-500 font-normal">点击念白</span>
                            </div>
                            <p className="leading-relaxed font-serif text-[11.5px]">{dg.lines}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-950 p-6 rounded-lg text-center border border-stone-800/80 flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-stone-600" />
                    <p className="text-xs text-stone-400 font-serif">暂无排演剧本</p>
                    <p className="text-[10px] text-stone-500">在左下角输入主题，由AI定制一折纸影好戏唱本吧！</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. RECORDING TAB */}
            {activeSidebarTab === "record" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-serif font-bold text-amber-300 text-sm mb-1.5">戏台动作录制 (Puppet Choreography)</h4>
                  <p className="text-xs text-stone-400">
                    像真正的皮影匠人一样，按下录制，亲手拨拉操控杆，将行头们的优美身姿记录存盘。
                  </p>
                </div>

                {/* Main controls */}
                <div className="bg-stone-950 border border-stone-800 p-4 rounded-lg flex flex-col gap-4">
                  
                  {isRecording ? (
                    <div className="flex flex-col items-center justify-center gap-2.5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-serif text-red-400 font-bold">后台记录仪运行中...</span>
                      </div>
                      <p className="text-[10px] text-stone-400">已录制：{currentRecordingFrames.length} 帧关节序列</p>
                      
                      <button
                        onClick={stopRecording}
                        className="mt-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold font-serif text-xs transition shadow flex items-center gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5" />
                        停止并封存剧目
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                      <div className="text-[11px] text-stone-400 mb-1">
                        {activePuppet
                          ? `选定操演人物: ${activePuppet.name}`
                          : "请在左边戏台上选定一名皮影人作为主角"}
                      </div>
                      
                      <button
                        onClick={startRecording}
                        disabled={!activePuppet || playingRecordingId !== null}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded font-serif text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        开始执杆录像
                      </button>
                    </div>
                  )}

                </div>

                {/* SAVED RECORDINGS LIST */}
                <div className="border-t border-stone-800/80 pt-4">
                  <h5 className="text-xs font-serif font-bold text-amber-300 mb-2">已封存折子戏唱本 ({savedRecordings.length})</h5>
                  {savedRecordings.length === 0 ? (
                    <p className="text-xs text-stone-500 italic text-center py-4">暂无动作录像。快开始操演一段吧！</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {savedRecordings.map((rec, rIdx) => {
                        const isPlaying = playingRecordingId === rIdx;
                        return (
                          <div
                            key={rIdx}
                            className={`flex items-center justify-between p-2 rounded text-xs border ${
                              isPlaying
                                ? "bg-amber-950/30 border-amber-600/50 text-amber-200"
                                : "bg-stone-950 border-stone-800 text-stone-300"
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-serif font-bold text-[11px]">{rec.name}</span>
                              <span className="text-[9px] text-stone-500 font-mono">
                                帧数: {rec.frames.length} / 时长: {(rec.duration / 1000).toFixed(1)}s
                              </span>
                            </div>

                            <button
                              onClick={() => playAnimation(rec, rIdx)}
                              disabled={isPlaying || isRecording}
                              className="px-2 py-1 bg-amber-950 hover:bg-amber-900 border border-amber-900 text-amber-300 text-[10px] rounded"
                            >
                              {isPlaying ? "放映中..." : "戏台放映"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SHARED DESIGN FOOTER ACCENTS */}
            <div className="border-t border-stone-800/80 pt-3 mt-4 flex items-center justify-between text-[10px] text-stone-500 font-serif">
              <span>中国皮影 · 羊皮雕饰雕镂工艺</span>
              <span>天工物华 · 匠心传承</span>
            </div>

          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-stone-900 bg-stone-950 py-6 px-6 text-center text-xs text-stone-500 font-serif flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1600px] w-full mx-auto" id="app-footer">
        <div>
          <span>华夏皮影工坊 © 2026</span>
          <span className="mx-2">·</span>
          <span>使用天然皮革及民间骨殖雕镂图样</span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-amber-400 transition">工艺志</a>
          <a href="#" className="hover:text-amber-400 transition">曲腔曲牌</a>
          <a href="#" className="hover:text-amber-400 transition">匠人联络</a>
        </div>
      </footer>

      {/* TUTORIAL MODAL OVERLAY */}
      {showTutorial && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="tutorial-overlay">
          <div className="bg-stone-900 border-2 border-amber-700 max-w-xl w-full rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowTutorial(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-950 p-2 rounded border border-amber-800">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-amber-200">欢迎登堂入室 · 华夏影戏传习录</h3>
                <p className="text-xs text-stone-400">东方纸影皮腔 · 手脑同游妙趣</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-stone-300 font-serif">
              <p>
                皮影戏（Shadow Puppetry），又称“影子戏”或“纸影戏”，是一种以兽皮或纸板剪贴成人物剪影，于暖黄半透明幕布后，通过光源漫射显影，伴有念唱的传统表演艺术。
              </p>
              
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="text-amber-500">●</span> 执杆演戏 (杆柄操作)：
                </div>
                <p className="pl-3 text-[11px] text-stone-400">
                  戏台上的皮影连接着数根操纵杆。<strong>拖拽红黄色的圆环手柄</strong>，即可操控皮影关节：
                  <br />
                  - <strong className="text-amber-200">主支撑杆</strong>：平移整个影人角色（戏台上任意飞跃走位）。
                  - <strong className="text-amber-200">其他副操纵杆</strong>：自然牵引出其连带的前臂、长尾、猛虎头首和足部姿态。
                </p>
                
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="text-amber-500">●</span> 关节雕琢与染墨：
                </div>
                <p className="pl-3 text-[11px] text-stone-400">
                  在“关节雕刻”选项卡中，您能单独校准每一折连结骨殖的精确偏角、伸缩其大小、乃至晕染牛皮的色泽。
                </p>

                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <span className="text-amber-500">●</span> AI 编唱配唱词：
                </div>
                <p className="pl-3 text-[11px] text-stone-400">
                  在左下角输入主题，由 AI 撰写极其纯正的传统戏曲剧本。点击对话段落，影人将配合唱念。
                </p>
              </div>

              <p className="text-amber-200 text-[11px] italic text-center">
                “三尺生绡做戏台，全凭十指拨调来。有时歌舞升平乐，霎时兵戈动地哀。”
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowTutorial(false)}
                className="px-6 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded-lg text-xs font-bold font-serif shadow-md hover:shadow-lg transition"
                id="btn-close-tutorial"
              >
                领会，开锣起鼓！
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
