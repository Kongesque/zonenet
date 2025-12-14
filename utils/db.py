import sqlite3
import json

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
            name TEXT,
            filename TEXT,
            video_path TEXT,
            frame_path TEXT,
            frame_width INTEGER,
            frame_height INTEGER,
            points TEXT, 
            color TEXT,
            process_time REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Simple migration for existing databases
    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN name TEXT')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass

    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN process_time REAL')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass

    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT "pending"')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass

    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN target_class INTEGER DEFAULT 19')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass

    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN confidence INTEGER DEFAULT 40')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass
        
    conn.commit()
    conn.close()

def create_job(task_id, filename, video_path):
    conn = get_db()
    # Default name to filename, status to pending, target_class to 19 (cow), confidence to 40
    conn.execute(
        'INSERT INTO jobs (id, name, filename, video_path, points, color, status, target_class, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (task_id, filename, filename, video_path, '[]', '[5, 189, 251]', 'pending', 19, 40)
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
             
        # Ensure target_class is present (for old records)
        if 'target_class' not in job_dict or job_dict['target_class'] is None:
            job_dict['target_class'] = 19
            
        # Ensure confidence is present (for old records)
        if 'confidence' not in job_dict or job_dict['confidence'] is None:
            job_dict['confidence'] = 25
             
        return job_dict
    return None

def get_all_jobs(status=None):
    conn = get_db()
    if status:
        jobs = conn.execute('SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC', (status,)).fetchall()
    else:
        jobs = conn.execute('SELECT * FROM jobs ORDER BY created_at DESC').fetchall()
    conn.close()
    return [dict(job) for job in jobs]

def delete_job(task_id):
    conn = get_db()
    conn.execute('DELETE FROM jobs WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

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
