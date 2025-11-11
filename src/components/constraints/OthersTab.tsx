import { SleepConstraintCard } from "./SleepConstraintCard";
import { PersonalTimeCard } from "./PersonalTimeCard";
import { CommuteCard } from "./CommuteCard";

interface OthersTabProps {
  wakeUpTime: string;
  noStudyAfter: string;
  sleepHoursNeeded: number;
  minPersonalTimePerWeek: number;
  commuteHomeSchool: number;
  commuteHomeJob: number;
  commuteHomeActivity: number;
  onSleepConstraintSave: (data: { wakeUpTime: string; noStudyAfter: string; sleepHoursNeeded: number }) => void;
  onPersonalTimeSave: (value: number) => void;
  onCommuteSave: (data: { commuteHomeSchool: number; commuteHomeJob: number; commuteHomeActivity: number }) => void;
}

export const OthersTab = ({
  wakeUpTime,
  noStudyAfter,
  sleepHoursNeeded,
  minPersonalTimePerWeek,
  commuteHomeSchool,
  commuteHomeJob,
  commuteHomeActivity,
  onSleepConstraintSave,
  onPersonalTimeSave,
  onCommuteSave,
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
        commuteHomeSchool={commuteHomeSchool}
        commuteHomeJob={commuteHomeJob}
        commuteHomeActivity={commuteHomeActivity}
        onSave={onCommuteSave}
      />
    </div>
  );
};
