import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("207.154.220.197", username="root", password="DigitalOceanRoot@2026!")
stdin, stdout, stderr = client.exec_command("cd /root/ekspeditor-pro && docker-compose logs app")
print(stdout.read().decode('utf-8'))
client.close()
