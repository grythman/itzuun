import json
import os
import time
import subprocess

# ==========================================
# 1. SOCKS5 PROXY ТОХИРГОО
# ==========================================
PROXY_URL = "socks5://127.0.0.1:40001"

os.environ["ALL_PROXY"] = PROXY_URL
os.environ["HTTP_PROXY"] = PROXY_URL
os.environ["HTTPS_PROXY"] = PROXY_URL
os.environ["http_proxy"] = PROXY_URL
os.environ["https_proxy"] = PROXY_URL
os.environ["GIT_TERMINAL_PROMPT"] = "0"
os.environ["AUTO_CONFIRM"] = "true"

BRIDGE_FILE = 'agent_bridge.json'
ROADMAP_FILE = 'ROADMAP_30_60_90.md'

# ==========================================
# 2. ШИНЭ ПЛАННЕР (STANDALONE COPILOT CLI)
# ==========================================
def call_planner():
    print("\n🧠 [PLANNER]: Шинэ Copilot CLI-ээр төлөвлөж байна...")
    
    prompt = f"Read {ROADMAP_FILE} and analyze current repo state. Identify the NEXT logical feature. Return a 10-step implementation_plan. Set status to 'pending'. CRITICAL: All terminal commands MUST be non-interactive (-y, --force). Output ONLY raw JSON."
    
    try:
        # Энд 'gh' биш, шууд 'copilot' дуудагдана
        result = subprocess.run(
            ["copilot", "--prompt", prompt],
            capture_output=True, text=True, check=True
        )
        
        output = result.stdout.strip()
        
        # Markdown backticks цэвэрлэх
        if "```json" in output:
            output = output.split("```json")[1].split("```")[0].strip()
        elif "```" in output:
            output = output.split("```")[1].split("```")[0].strip()
            
        parsed_json = json.loads(output)
        
        with open(BRIDGE_FILE, 'w', encoding='utf-8') as f:
            json.dump(parsed_json, f, indent=2)
            
        print("✅ [PLANNER]: Дараагийн даалгавар бэлэн боллоо.")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ [PLANNER ERROR]: Команд алдаа заалаа:\n{e.stderr}")
    except json.JSONDecodeError:
        print(f"❌ [PLANNER ERROR]: AI-ийн хариу JSON биш байна:\n{output}")
    except Exception as e:
        print(f"❌ [PLANNER ERROR]: Гэнэтийн алдаа: {e}")

# ==========================================
# 3. ГҮЙЦЭТГЭГЧ (EXECUTOR)
# ==========================================
def run_executor(task_data):
    task_title = task_data.get('task', {}).get('title', 'Unknown Task')
    print(f"\n🛠️ [EXECUTOR]: {task_title} хийж байна...")
    
    plan = task_data.get('spec', {}).get('implementation_plan', [])
    
    for step in plan:
        print(f"   ▶ Алхам {step.get('step')}: {step.get('title')}")
        if 'commands' in step:
            for cmd in step['commands']:
                subprocess.run(cmd, shell=True, check=True)
                    
    # Тест шалгах
    validate_cmd = task_data.get('spec', {}).get('executor', {}).get('validate_command', '')
    if validate_cmd:
        result = subprocess.run(validate_cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stderr
            
    return True, "Success"

# ==========================================
# 4. ҮНДСЭН ГОГЦОО (LOOP)
# ==========================================
if __name__ == "__main__":
    print("🚀 ITZuun Agentic Loop (Launch Readiness) эхэллээ...")
    while True:
        if not os.path.exists(BRIDGE_FILE):
            print("⏳ agent_bridge.json олдсонгүй, хүлээж байна...")
            time.sleep(5)
            continue

        with open(BRIDGE_FILE, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                time.sleep(5)
                continue

        status = data.get('status')

        if status == 'completed':
            call_planner()
        elif status == 'pending':
            # Давхар ажиллахаас сэргийлж executing төлөвт оруулах
            data['status'] = 'executing'
            with open(BRIDGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)

            success, output = run_executor(data)
            
            data['status'] = 'completed' if success else 'error'
            data['feedback'] = "All tests passed." if success else output
            
            with open(BRIDGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
                
            if not success:
                print(f"\n🛑 [ЗОГСООЛ]: Алдаа гарсан тул зогслоо. Алдаа: {output}")
                break

        time.sleep(10)