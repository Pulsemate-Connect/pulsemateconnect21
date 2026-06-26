# Check all keystores to find the one with correct SHA1
$targetSHA1 = "67:09:D6:4B:61:93:2A:FD:85:61:A3:95:E5:96:07:13:37:67:8B:8D"
$passwords = @("android", "pulsemate", "pulsemate123", "")

$keystores = @(
    "@shubhamskkk__pulsemate-app.jks",
    "@shubhamskkk__pulsemate-app.bak.jks",
    "@shubhamskkk__pulsemate-app_OLD_1.jks",
    "credentials\android\keystore.jks"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking All Keystores" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Looking for SHA1: $targetSHA1`n" -ForegroundColor Yellow

foreach ($keystore in $keystores) {
    if (Test-Path $keystore) {
        Write-Host "Checking: $keystore" -ForegroundColor Green
        
        foreach ($pass in $passwords) {
            try {
                $output = keytool -list -keystore $keystore -storepass $pass 2>&1 | Out-String
                
                if ($output -match "SHA1:\s*([A-F0-9:]+)") {
                    $sha1 = $matches[1].Trim()
                    Write-Host "  Password: '$pass'" -ForegroundColor White
                    Write-Host "  SHA1: $sha1" -ForegroundColor White
                    
                    if ($sha1 -eq $targetSHA1) {
                        Write-Host "  *** MATCH FOUND! ***" -ForegroundColor Green -BackgroundColor Black
                        Write-Host "`n  Use this keystore: $keystore" -ForegroundColor Green
                        Write-Host "  Password: $pass`n" -ForegroundColor Green
                    }
                    break
                }
            } catch {
                # Wrong password, continue
            }
        }
        Write-Host ""
    }
}

Write-Host "Done!" -ForegroundColor Cyan
