import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const POMODORO_TIME = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

export const PomodoroTimer = () => {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalTime = mode === "pomodoro" 
    ? POMODORO_TIME 
    : mode === "shortBreak" 
    ? SHORT_BREAK 
    : LONG_BREAK;

  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    if (mode === "pomodoro") {
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);
      
      // After 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        switchMode("longBreak");
      } else {
        switchMode("shortBreak");
      }
    } else {
      switchMode("pomodoro");
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    
    if (newMode === "pomodoro") {
      setTimeLeft(POMODORO_TIME);
    } else if (newMode === "shortBreak") {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getModeLabel = () => {
    switch (mode) {
      case "pomodoro":
        return "Focus";
      case "shortBreak":
        return "Pause courte";
      case "longBreak":
        return "Pause longue";
    }
  };

  return (
    <Card className="border border-border shadow-[var(--shadow-medium)]">
      <CardHeader>
        <CardTitle className="text-center">Pomodoro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => switchMode("pomodoro")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mode === "pomodoro"
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mode === "shortBreak"
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pause
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mode === "longBreak"
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Longue
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative">
          <div className="text-6xl font-bold text-center text-foreground mb-4">
            {formatTime(timeLeft)}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={toggleTimer}
            size="lg"
            className="gap-2 shadow-[var(--shadow-soft)]"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Démarrer
              </>
            )}
          </Button>
          <Button
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Sessions terminées aujourd'hui
          </p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {pomodorosCompleted}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
