import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT id, title, hot_level
FROM "Exam"
WHERE skill = 'READING' AND is_published = true
ORDER BY title;
"""
run_sql(sql)
