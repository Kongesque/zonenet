import sqlite3
import argparse
import sys
from utils.db import DB_PATH, init_db

def view_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT * FROM jobs").fetchall()
        if not rows:
            print("Database is empty.")
            return

        print(f"{'ID':<38} | {'Filename':<20} | {'Created At':<20}")
        print("-" * 85)
        for row in rows:
            print(f"{row['id']:<38} | {row['filename'][:20]:<20} | {row['created_at']}")
        print(f"\nTotal rows: {len(rows)}")
    except sqlite3.OperationalError:
        print("Table 'jobs' does not exist yet.")
    finally:
        conn.close()

def clear_db():
    confirm = input("Are you sure you want to delete ALL data? (y/N): ")
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("DROP TABLE IF EXISTS jobs")
        conn.commit()
        print("Table 'jobs' dropped.")
        
        # Re-initialize
        init_db()
        print("Database re-initialized (empty).")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

def prune_files():
    import os
    print("This will delete ALL input videos and frames, keeping only the outputs.")
    confirm = input("Are you sure? (y/N): ")
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute("SELECT id, video_path, frame_path FROM jobs").fetchall()
        deleted_count = 0
        
        for row in rows:
            # Delete video
            if row['video_path'] and os.path.exists(row['video_path']):
                try:
                    os.remove(row['video_path'])
                    deleted_count += 1
                    print(f"Deleted: {row['video_path']}")
                except OSError as e:
                    print(f"Error deleting {row['video_path']}: {e}")

            # Delete frame
            if row['frame_path'] and os.path.exists(row['frame_path']):
                try:
                    os.remove(row['frame_path'])
                    deleted_count += 1
                    print(f"Deleted: {row['frame_path']}")
                except OSError as e:
                    print(f"Error deleting {row['frame_path']}: {e}")

            # Update DB to nullify paths
            conn.execute("UPDATE jobs SET video_path = NULL, frame_path = NULL WHERE id = ?", (row['id'],))
        
        conn.commit()
        print(f"\nCleanup complete. {deleted_count} files deleted.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage the tasks database.")
    parser.add_argument('action', choices=['view', 'clear', 'prune'], help="Action to perform")
    
    args = parser.parse_args()
    
    if args.action == 'view':
        view_db()
    elif args.action == 'clear':
        clear_db()
    elif args.action == 'prune':
        prune_files()
