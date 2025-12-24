import time
import os
import subprocess
from datetime import datetime

WATCH_FILE = "tilda-analytics.js"
POLL_INTERVAL = 2  # секунды

def get_file_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return 0

def run_git_commands():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚡ Detected change! Pushing to GitHub...")
    
    # 1. Add
    if subprocess.call(["git", "add", "."], shell=True) != 0:
        print("❌ Git Add failed")
        return

    # 2. Commit
    msg = f"Auto-update {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    if subprocess.call(["git", "commit", "-m", msg], shell=True) != 0:
        print("⚠️ Nothing to commit")
        # Не возвращаем return, пробуем пуш (вдруг коммит уже был)

    # 3. Push
    if subprocess.call(["git", "push"], shell=True) == 0:
        print("✅ Successfully pushed to GitHub!")
    else:
        print("❌ Git Push failed")

def main():
    print(f"👀 Watching '{WATCH_FILE}' for changes...")
    print("   (Minimize this window and let it run)")
    
    last_mtime = get_file_mtime(WATCH_FILE)
    
    try:
        while True:
            time.sleep(POLL_INTERVAL)
            current_mtime = get_file_mtime(WATCH_FILE)
            
            if current_mtime != last_mtime:
                # Ждем 1 секунду, чтобы запись файла точно завершилась
                time.sleep(1) 
                last_mtime = current_mtime
                run_git_commands()
                # Обновляем таймстемп еще раз на случай, если git сам что-то тронул
                last_mtime = get_file_mtime(WATCH_FILE)
                
    except KeyboardInterrupt:
        print("\n🛑 Watcher stopped.")

if __name__ == "__main__":
    main()
