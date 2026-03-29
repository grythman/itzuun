import json
import time
import subprocess
import os

BRIDGE_FILE = 'agent_bridge.json'

def run_executor():
    print("🚀 Watchdog идэвхжлээ. 'pending' статусыг хүлээж байна...")
    
    while True:
        if os.path.exists(BRIDGE_FILE):
            try:
                with open(BRIDGE_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Хэрэв статус pending байвал Executor-ийг ажиллуулна
                if data.get('status') == 'pending':
                    task = data.get('task')
                    print(f"\n[TASK FOUND]: {task}")
                    
                    # Статусыг 'executing' болгож өөрчлөх
                    data['status'] = 'executing'
                    with open(BRIDGE_FILE, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)

                    print("🛠️ Codex ажиллаж байна... (Түр хүлээнэ үү)")
                    
                    # Энд Codex-ийг ажиллуулах тушаал явна. 
                    # Та Cursor эсвэл CLI ашиглаж байгаа бол доорх хэсэгт тушаалыг нь бичнэ.
                    # Одоогоор гараар баталгаажуулах горимд орууллаа:
                    input(">>> Кодыг бичиж дууссан бол ENTER дарж статусыг 'completed' болгоно уу...")

                    data['status'] = 'completed'
                    with open(BRIDGE_FILE, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    print("✅ Task дууслаа. Дараагийн task-ийг хүлээж байна.")

            except Exception as e:
                print(f"❌ Алдаа гарлаа: {e}")
        
        time.sleep(5) # 5 секунд тутамд файлыг шалгана

if __name__ == "__main__":
    run_executor()