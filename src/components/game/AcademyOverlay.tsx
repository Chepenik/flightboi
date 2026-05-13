"use client";

import { BookOpen, CheckCircle2, GraduationCap, Wind } from "lucide-react";
import { academyLessons, getLesson } from "@/lib/flight/catalog";
import { useGameStore } from "@/lib/flight/store";
import { AcademyLessonId } from "@/lib/flight/types";

export function AcademyOverlay() {
  const modeId = useGameStore((state) => state.modeId);
  const lessonId = useGameStore((state) => state.academyLessonId);
  const telemetry = useGameStore((state) => state.telemetry);
  const setLesson = useGameStore((state) => state.setAcademyLesson);
  const lesson = getLesson(lessonId);

  if (modeId !== "sky-academy" && modeId !== "pilot-sandbox") return null;

  return (
    <section className="academy-panel" data-flight-ui="true" aria-label="Sky Academy">
      <div className="panel-header">
        <span><GraduationCap size={16} /></span>
        <div>
          <strong>Sky Academy</strong>
          <small>{lesson.title}</small>
        </div>
      </div>

      <div className="lesson-select">
        {academyLessons.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === lessonId ? "active" : ""}
            onClick={() => setLesson(item.id as AcademyLessonId)}
            title={item.objective}
          >
            {item.title.replace(" & ", " + ")}
          </button>
        ))}
      </div>

      <div className="lesson-card">
        <BookOpen size={16} />
        <p>{lesson.objective}</p>
      </div>

      <div className="lesson-checks">
        {lesson.checkpoints.map((checkpoint, index) => (
          <span key={checkpoint}>
            <CheckCircle2 size={14} />
            {index === telemetry.checkpointIndex % lesson.checkpoints.length ? <b>{checkpoint}</b> : checkpoint}
          </span>
        ))}
      </div>

      <div className="instructor-callout">
        <Wind size={15} />
        <span>{telemetry.stall ? lesson.mistakeCoaching : telemetry.message}</span>
      </div>

      <div className="grade-meter">
        <span>Lesson grade</span>
        <i><b style={{ width: `${telemetry.lessonGrade}%` }} /></i>
        <strong>{Math.round(telemetry.lessonGrade)}</strong>
      </div>
    </section>
  );
}
