import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

type PomodoroMode = 'work' | 'break' | 'longBreak';

export const PomodoroTimer = () => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const durations = {
    work: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Session terminée
      setIsRunning(false);
      if (mode === 'work') {
        const newSessions = sessionsCompleted + 1;
        setSessionsCompleted(newSessions);
        // Pause courte ou longue
        if (newSessions % 4 === 0) {
          setMode('longBreak');
          setTimeLeft(durations.longBreak);
        } else {
          setMode('break');
          setTimeLeft(durations.break);
        }
      } else {
        setMode('work');
        setTimeLeft(durations.work);
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, sessionsCompleted]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const handleModeChange = (newMode: PomodoroMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work': return 'text-primary';
      case 'break': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'work': return 'Travail';
      case 'break': return 'Pause';
      case 'longBreak': return 'Pause longue';
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pomodoro</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {sessionsCompleted} session{sessionsCompleted > 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'work' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('work')}
            className="flex-1"
          >
            Travail
          </Button>
          <Button
            variant={mode === 'break' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('break')}
            className="flex-1"
          >
            Pause
          </Button>
          <Button
            variant={mode === 'longBreak' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('longBreak')}
            className="flex-1"
          >
            Longue
          </Button>
        </div>

        <div className="text-center mb-4">
          <div className={`text-5xl font-bold mb-2 ${getModeColor()}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-sm text-muted-foreground">{getModeLabel()}</div>
        </div>

        <Progress value={progress} className="mb-4 h-2" />

        <div className="flex gap-2">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            className="flex-1"
            size="lg"
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
