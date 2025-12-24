$msg = $args[0]
if ([string]::IsNullOrEmpty($msg)) { $msg = "Auto-update" }

Write-Host "🚀 Starting Auto-Deploy: $msg" -ForegroundColor Green

git add .
if ($LASTEXITCODE -eq 0) {
    git commit -m "$msg"
    if ($LASTEXITCODE -eq 0) {
        git push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Success!" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Push Failed" -ForegroundColor Red
        }
    }
    else {
        Write-Host "⚠️ Nothing to commit or Commit Failed" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ Git Add Failed" -ForegroundColor Red
}
