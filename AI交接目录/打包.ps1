$ErrorActionPreference = 'Stop'
$handoffRoot = $PSScriptRoot
$deliveryRoot = Split-Path -Parent $handoffRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$fullBundle = Join-Path $deliveryRoot ("实验室管家-AI交接包-" + $stamp + ".zip")
$imageBundle = Join-Path $deliveryRoot ("实验室管家-分模块图片-" + $stamp + ".zip")
Compress-Archive -LiteralPath $handoffRoot -DestinationPath $fullBundle -CompressionLevel Optimal
Compress-Archive -LiteralPath (Join-Path $handoffRoot '功能模块') -DestinationPath $imageBundle -CompressionLevel Optimal
Write-Output $fullBundle
Write-Output $imageBundle

