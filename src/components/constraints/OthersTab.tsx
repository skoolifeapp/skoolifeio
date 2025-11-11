import { SleepConstraintCard } from "./SleepConstraintCard";
import { PersonalTimeCard } from "./PersonalTimeCard";
import { CommuteCard } from "./CommuteCard";

interface Commute {
  name: string;
  duration_minutes: number;
}

interface OthersTabProps {
  wakeUpTime: string;
  noStudyAfter: string;
  sleepHoursNeeded: number;
  minPersonalTimePerWeek: number;
  commutes: Commute[];
  availableActivities: string[];
  onSleepConstraintSave: (data: { wakeUpTime: string; noStudyAfter: string; sleepHoursNeeded: number }) => void;
  onPersonalTimeSave: (value: number) => void;
  onCommutesSave: (commutes: Commute[]) => void;
}

export const OthersTab = ({
  wakeUpTime,
  noStudyAfter,
  sleepHoursNeeded,
  minPersonalTimePerWeek,
  commutes,
  availableActivities,
  onSleepConstraintSave,
  onPersonalTimeSave,
  onCommutesSave,
}: OthersTabProps) => {
  return (
    <div className="space-y-6">
      <SleepConstraintCard
        wakeUpTime={wakeUpTime}
        noStudyAfter={noStudyAfter}
        sleepHoursNeeded={sleepHoursNeeded}
        onSave={onSleepConstraintSave}
      />

      <PersonalTimeCard
        minPersonalTimePerWeek={minPersonalTimePerWeek}
        onSave={onPersonalTimeSave}
      />

      <CommuteCard
        commutes={commutes}
        availableActivities={availableActivities}
        onSave={onCommutesSave}
      />
    </div>
  );
};
