import sqlite3
import os
import json

DB_PATH = 'instance/tasks.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    # Ensure instance directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
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
        
    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN detection_data TEXT')
    except sqlite3.OperationalError:
        # Column likely already exists
        pass
        
    conn.commit()
    conn.close()

    # Add progress column
    conn = get_db()
    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN progress INTEGER DEFAULT 0')
        conn.commit()
    except sqlite3.OperationalError:
        pass
    conn.close()

    # Add zones column for multiple zone support
    conn = get_db()
    try:
        conn.execute('ALTER TABLE jobs ADD COLUMN zones TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass
    conn.close()

def create_job(task_id, filename, video_path):
    conn = get_db()
    # Default name to filename, status to pending, confidence to 40
    # Initialize with empty zones array (zones replaces points/color/target_class per zone)
    conn.execute(
        'INSERT INTO jobs (id, name, filename, video_path, points, color, status, target_class, confidence, zones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (task_id, filename, filename, video_path, '[]', '[5, 189, 251]', 'pending', 19, 40, '[]')
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
             
        try:
             job_dict['detection_data'] = json.loads(job_dict['detection_data']) if job_dict['detection_data'] else []
        except:
             job_dict['detection_data'] = []

        # Parse zones JSON (for multiple zone support)
        try:
            job_dict['zones'] = json.loads(job_dict['zones']) if job_dict.get('zones') else []
        except:
            job_dict['zones'] = []
             
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
    if 'detection_data' in kwargs:
        kwargs['detection_data'] = json.dumps(kwargs['detection_data'])
    if 'zones' in kwargs:
        kwargs['zones'] = json.dumps(kwargs['zones'])

    columns = ', '.join(f"{key} = ?" for key in kwargs.keys())
    values = list(kwargs.values())
    values.append(task_id)
    
    conn.execute(f'UPDATE jobs SET {columns} WHERE id = ?', values)
    conn.commit()
    conn.close()

