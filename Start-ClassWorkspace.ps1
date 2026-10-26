$ErrorActionPreference = 'Stop'
$workspaceRoot = $PSScriptRoot
$logRoot = Join-Path $workspaceRoot 'tmp'
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null
$nodePath = (Get-Command node).Source
$services = @(
    @{ Name = 'orby-voice'; Port = 4319; Folder = $workspaceRoot; Arguments = 'backend/src/voice-server.js' },
    @{ Name = 'class-worker'; Port = 4318; Folder = $workspaceRoot; Arguments = 'backend/src/class-server.js' },
    @{ Name = 'class-admin'; Port = 3002; Folder = $workspaceRoot; Arguments = 'node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3002' },
    @{ Name = 'class-study'; Port = 3000; Folder = (Join-Path $workspaceRoot '..\Ssc'); Arguments = 'node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3000' },
    @{ Name = 'class-dubbing'; Port = 3003; Folder = (Join-Path $workspaceRoot '..\Live Class'); Arguments = 'node_modules/next/dist/bin/next dev -H 127.0.0.1 -p 3003' }
)
foreach ($service in $services) {
    $listener = Get-NetTCPConnection -LocalPort $service.Port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Output "$($service.Name) already has a listener on port $($service.Port)."
        continue
    }
    Start-Process -FilePath $nodePath -ArgumentList $service.Arguments -WorkingDirectory $service.Folder -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logRoot "$($service.Name).out.log") -RedirectStandardError (Join-Path $logRoot "$($service.Name).err.log") | Out-Null
}
Write-Output 'Class admin: http://127.0.0.1:3002/admin'
