import os
import subprocess
import time

def dump_local_db():
    print("Step 1: Dumping local database 'aptis_kytich_db'...")
    dump_file = "d:/sontayweb/aptis-elearning/backend/local_dump.sql"
    env = os.environ.copy()
    env["PGPASSWORD"] = "postgres"
    
    cmd = [
        "pg_dump",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "--clean",
        "--if-exists",
        "-d", "aptis_kytich_db",
        "-f", dump_file
    ]
    
    start = time.time()
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print("pg_dump ERROR:\n", res.stderr)
        return False
    
    size_mb = os.path.getsize(dump_file) / (1024 * 1024)
    print(f"Dump completed in {time.time() - start:.2f}s! File size: {size_mb:.2f} MB")
    return True

if __name__ == '__main__':
    dump_local_db()
