import sqlite3
import json
import os

DB_PATH = 'tasks.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            filename TEXT,
            video_path TEXT,
            frame_path TEXT,
            frame_width INTEGER,
            frame_height INTEGER,
            points TEXT, 
            color TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def create_job(task_id, filename, video_path):
    conn = get_db()
    conn.execute(
        'INSERT INTO jobs (id, filename, video_path, points, color) VALUES (?, ?, ?, ?, ?)',
        (task_id, filename, video_path, '[]', '[5, 189, 251]')
    )
    conn.commit()
    conn.close()

def get_job(task_id):
    conn = get_db()
    job = conn.execute('SELECT * FROM jobs WHERE id = ?', (task_id,)).fetchone()
    conn.close()
    if job:
        # Convert Row to dict for easier manipulation if needed, handling JSON fields
        job_dict = dict(job)
        try:
            job_dict['points'] = json.loads(job_dict['points'])
        except:
             job_dict['points'] = []
             
        try:
             job_dict['color'] = json.loads(job_dict['color'])
        except:
             job_dict['color'] = [5, 189, 251]
             
        return job_dict
    return None

def update_job(task_id, **kwargs):
    conn = get_db()
    
    # Pre-process JSON fields
    if 'points' in kwargs:
        kwargs['points'] = json.dumps(kwargs['points'])
    if 'color' in kwargs:
        kwargs['color'] = json.dumps(kwargs['color'])

    columns = ', '.join(f"{key} = ?" for key in kwargs.keys())
    values = list(kwargs.values())
    values.append(task_id)
    
    conn.execute(f'UPDATE jobs SET {columns} WHERE id = ?', values)
    conn.commit()
    conn.close()
