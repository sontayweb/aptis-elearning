import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT id, title, hot_level, is_published
FROM "Exam"
WHERE skill = 'READING'
ORDER BY title;
"""
run_sql(sql)
