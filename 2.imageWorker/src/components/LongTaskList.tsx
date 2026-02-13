import type { LongTaskSample } from '../utils/observLongTask'

export interface LongTaskListProps {
  longTasks: LongTaskSample[]
}

export const LongTaskList = ({ longTasks }: LongTaskListProps) => {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="mt-0 mb-2">Long Tasks (latest 20)</h3>
      {longTasks.length === 0 ? (
        <div className="text-gray-500">No samples yet.</div>
      ) : (
        <ul className="mt-0 ml-6 p-0">
          {longTasks.map((t) => (
            <li key={t.id}>
              {t.duration.toFixed(1)}ms — {t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
