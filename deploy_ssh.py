import paramiko
import time

def deploy():
    host = "207.154.220.197"
    port = 22
    username = "root"
    password = "DigitalOceanRoot@2026!"
    
    print(f"Connecting to {host} via SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(host, port, username, password)
        print("Connected successfully!")
        
        commands = [
            "cd /root/ekspeditor-pro && git stash",
            "cd /root/ekspeditor-pro && git clean -fd",
            "cd /root/ekspeditor-pro && git pull origin main",
            "cd /root/ekspeditor-pro && docker-compose down",
            "cd /root/ekspeditor-pro && docker-compose up -d --build",
            "cd /root/ekspeditor-pro && docker-compose logs --tail=50 app"
        ]
        
        for cmd in commands:
            print(f"\nExecuting: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            
            # Read output synchronously
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', errors='ignore')
            err = stderr.read().decode('utf-8', errors='ignore')
            
            if out:
                print(out)
            if err:
                print(err)
            
            print(f"Command finished with exit status: {exit_status}")
            
    except Exception as e:
        print(f"Connection or execution failed: {e}")
    finally:
        client.close()
        print("Connection closed.")

if __name__ == "__main__":
    deploy()
