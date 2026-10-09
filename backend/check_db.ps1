# Local DB smoke check — password comes from the environment, never from the file.
# Usage: $env:PGPASSWORD='<password>'; .\check_db.ps1
if (-not $env:PGPASSWORD) {
  $secure = Read-Host -AsSecureString 'PostgreSQL password'
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d naik_db -c 'SELECT COUNT(*) FROM users;'
