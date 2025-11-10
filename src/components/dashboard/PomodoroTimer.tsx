import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_POMODORO_TIME = 25 * 60; // 25 minutes
const DEFAULT_SHORT_BREAK = 5 * 60; // 5 minutes
const DEFAULT_LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = "pomodoro" | "shortBreak" | "longBreak";

export const PomodoroTimer = () => {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [pomodoroTime, setPomodoroTime] = useState(DEFAULT_POMODORO_TIME);
  const [shortBreakTime, setShortBreakTime] = useState(DEFAULT_SHORT_BREAK);
  const [longBreakTime, setLongBreakTime] = useState(DEFAULT_LONG_BREAK);
  const [timeLeft, setTimeLeft] = useState(pomodoroTime);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Temporary settings for the dialog
  const [tempPomodoroMinutes, setTempPomodoroMinutes] = useState(pomodoroTime / 60);
  const [tempShortBreakMinutes, setTempShortBreakMinutes] = useState(shortBreakTime / 60);
  const [tempLongBreakMinutes, setTempLongBreakMinutes] = useState(longBreakTime / 60);

  const totalTime = mode === "pomodoro" 
    ? pomodoroTime 
    : mode === "shortBreak" 
    ? shortBreakTime 
    : longBreakTime;

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
      setTimeLeft(pomodoroTime);
    } else if (newMode === "shortBreak") {
      setTimeLeft(shortBreakTime);
    } else {
      setTimeLeft(longBreakTime);
    }
  };
  
  const saveSettings = () => {
    const newPomodoroTime = tempPomodoroMinutes * 60;
    const newShortBreakTime = tempShortBreakMinutes * 60;
    const newLongBreakTime = tempLongBreakMinutes * 60;
    
    setPomodoroTime(newPomodoroTime);
    setShortBreakTime(newShortBreakTime);
    setLongBreakTime(newLongBreakTime);
    
    // Update current timer if not running
    if (!isRunning) {
      if (mode === "pomodoro") {
        setTimeLeft(newPomodoroTime);
      } else if (mode === "shortBreak") {
        setTimeLeft(newShortBreakTime);
      } else {
        setTimeLeft(newLongBreakTime);
      }
    }
    
    setIsSettingsOpen(false);
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-center flex-1">Pomodoro</CardTitle>
        <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Paramètres du Pomodoro</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="pomodoro-time">Durée Focus (minutes)</Label>
                <Input
                  id="pomodoro-time"
                  type="number"
                  min="1"
                  max="120"
                  value={tempPomodoroMinutes}
                  onChange={(e) => setTempPomodoroMinutes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short-break">Pause courte (minutes)</Label>
                <Input
                  id="short-break"
                  type="number"
                  min="1"
                  max="60"
                  value={tempShortBreakMinutes}
                  onChange={(e) => setTempShortBreakMinutes(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="long-break">Pause longue (minutes)</Label>
                <Input
                  id="long-break"
                  type="number"
                  min="1"
                  max="60"
                  value={tempLongBreakMinutes}
                  onChange={(e) => setTempLongBreakMinutes(Number(e.target.value))}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={saveSettings} className="w-full">
                Enregistrer
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Annuler
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
