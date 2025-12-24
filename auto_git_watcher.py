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
    timestamp = datetime.now().strftime('%H:%M:%S')
    print(f"[{timestamp}] ⚡ Detected change! Pushing to GitHub...")
    
    log_content = []
    
    def run_cmd(args, name):
        result = subprocess.run(args, shell=True, capture_output=True, text=True)
        log_content.append(f"--- {name} ---\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}\n")
        return result.returncode == 0

    # 1. Add
    if not run_cmd(["git", "add", "."], "GIT ADD"):
        print("❌ Git Add failed")
        return

    # 2. Commit
    msg = f"Auto-update {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    run_cmd(["git", "commit", "-m", msg], "GIT COMMIT") 
    # Ignore output for commit (it might be empty if nothing to commit)

    # 3. Push
    if run_cmd(["git", "push"], "GIT PUSH"):
        print("✅ Successfully pushed!")
        log_content.append("RESULT: SUCCESS")
    else:
        print("❌ Git Push failed")
        log_content.append("RESULT: FAILED")
        
    # Write to log file for the AI Agent
    with open("watcher_status.log", "w", encoding="utf-8") as f:
        f.write("\n".join(log_content))

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
