import paramiko

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting with look_for_keys=False, allow_agent=False...")
    try:
        ssh.connect(
            '103.90.227.117',
            port=22,
            username='root',
            password='20b38CDUY2LiegWkvdJa',
            look_for_keys=False,
            allow_agent=False,
            timeout=10
        )
        print("🎉 SUCCESS! Logged in as root!")
        stdin, stdout, stderr = ssh.exec_command('whoami && uname -a && docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"')
        print(stdout.read().decode())
        ssh.close()
    except Exception as e:
        print("FAILED:", type(e), e)

if __name__ == '__main__':
    main()
