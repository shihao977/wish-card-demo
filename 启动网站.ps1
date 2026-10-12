param([int]$PreferredPort = 3030, [switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\')
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'
  '.mp3'  = 'audio/mpeg'
  '.ttf'  = 'font/ttf'
  '.woff' = 'font/woff'
  '.woff2'= 'font/woff2'
}

function Get-FreePort([int]$start, [int]$end) {
  for ($p = $start; $p -le $end; $p++) {
    try {
      $l = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
      $l.Start()
      $l.Stop()
      return $p
    } catch { }
  }
  throw "没有可用的本地端口：$start-$end"
}

function Send-Response($stream, [int]$status, [string]$contentType, [byte[]]$body, [bool]$headOnly = $false) {
  $reason = if ($status -eq 200) { 'OK' } elseif ($status -eq 403) { 'Forbidden' } elseif ($status -eq 404) { 'Not Found' } elseif ($status -eq 405) { 'Method Not Allowed' } else { 'Server Error' }
  $header = "HTTP/1.1 $status $reason`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if (-not $headOnly -and $body.Length -gt 0) { $stream.Write($body, 0, $body.Length) }
  $stream.Flush()
}

$port = Get-FreePort $PreferredPort ($PreferredPort + 20)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
$url = "http://127.0.0.1:$port/"
Write-Host ""
Write-Host "心愿卡本地网站已启动" -ForegroundColor Green
Write-Host "访问地址：$url" -ForegroundColor Cyan
Write-Host "请保持此窗口开启；按 Ctrl+C 可关闭网站服务。" -ForegroundColor DarkGray
Write-Host ""
if (-not $NoBrowser) { try { Start-Process $url | Out-Null } catch { } }

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
    $requestLine = $reader.ReadLine()
    if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }
    while ($true) {
      $line = $reader.ReadLine()
      if ($null -eq $line -or $line -eq '') { break }
    }

    $parts = $requestLine.Split(' ')
    $method = $parts[0].ToUpperInvariant()
    $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }

    if ($method -ne 'GET' -and $method -ne 'HEAD') {
      Send-Response $stream 405 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
      continue
    }

    $pathOnly = $rawPath.Split('?')[0]
    $decoded = [System.Uri]::UnescapeDataString($pathOnly)
    if ($decoded -eq '/') { $decoded = '/index.html' }
    $relative = $decoded.TrimStart('/').Replace('/', '\')
    $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relative))

    if (-not $filePath.StartsWith($root + '\', [System.StringComparison]::OrdinalIgnoreCase) -and $filePath -ne (Join-Path $root 'index.html')) {
      Send-Response $stream 403 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Forbidden'))
      continue
    }
    if (Test-Path -LiteralPath $filePath -PathType Container) {
      $filePath = Join-Path $filePath 'index.html'
    }
    if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
      Send-Response $stream 404 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Not Found'))
      continue
    }

    $ext = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $type = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    Send-Response $stream 200 $type $bytes ($method -eq 'HEAD')
  } catch {
    try {
      if ($stream) { Send-Response $stream 500 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Server Error')) }
    } catch { }
  } finally {
    if ($client) { $client.Close() }
  }
}
