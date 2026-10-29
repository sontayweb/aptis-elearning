import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT json_build_object(
  'id', es.id,
  'user_id', es.user_id,
  'exam_id', es.exam_id,
  'status', es.status,
  'total_score', es.total_score,
  'answers', (
    SELECT json_agg(json_build_object(
      'id', sa.id,
      'question_id', sa.question_id,
      'selected_option', sa.selected_option,
      'score', sa.score,
      'correct_answer', q.correct_answer,
      'explanation', q.explanation
    ))
    FROM "SubmissionAnswer" sa
    JOIN "Question" q ON q.id = sa.question_id
    WHERE sa.submission_id = es.id
  ),
  'exam', (
    SELECT json_build_object(
      'id', e.id,
      'title', e.title,
      'parts', (
        SELECT json_agg(json_build_object(
          'id', ep.id,
          'title', ep.title,
          'part_number', ep.part_number,
          'questions', (
            SELECT json_agg(json_build_object(
              'id', q.id,
              'question_number', q.question_number,
              'prompt', q.prompt,
              'options', q.options,
              'correct_answer', q.correct_answer,
              'explanation', q.explanation
            ))
            FROM "Question" q
            WHERE q.part_id = ep.id
          )
        ))
        FROM "ExamPart" ep
        WHERE ep.exam_id = e.id
      )
    )
    FROM "Exam" e
    WHERE e.id = es.exam_id
  )
)::text
FROM "ExamSubmission" es
WHERE es.id = 'd087bbfe-a663-4243-9bf6-9198427207b2';
"""
run_sql(sql)
