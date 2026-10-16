param(
    [Parameter(Position = 0)][string]$VideoPath,
    [ValidateRange(50, 1900)][int]$TargetMB = 480
)

$ErrorActionPreference = 'Stop'
try {
    if (-not $VideoPath) { $VideoPath = Read-Host 'Path to your video' }
    $source = (Resolve-Path -LiteralPath $VideoPath -ErrorAction Stop).Path
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw 'Choose a video file.' }
    foreach ($tool in @('ffmpeg', 'ffprobe')) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            throw "$tool is missing. Install FFmpeg first (for example, winget install Gyan.FFmpeg), then open a new terminal."
        }
    }
    $durationText = & ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $source
    if ($LASTEXITCODE -ne 0) { throw 'Could not read the video duration.' }
    $duration = 0.0
    if (-not [double]::TryParse(($durationText | Select-Object -First 1), [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$duration) -or $duration -le 0) {
        throw 'The video needs a readable duration.'
    }
    $audioKbps = 128
    # Leave room for audio and MP4 overhead so the result normally fits under 500 MiB.
    $videoKbps = [int][Math]::Floor(($TargetMB * 1048576.0 * 8 * 0.96 / $duration / 1000) - $audioKbps)
    if ($videoKbps -lt 100) { throw 'This target is too small for the duration of the video.' }
    $folder = [IO.Path]::GetDirectoryName($source)
    $stem = [IO.Path]::GetFileNameWithoutExtension($source)
    $output = Join-Path $folder "$stem-bootleg-${TargetMB}mb.mp4"
    if (Test-Path -LiteralPath $output) { throw "Output already exists: $output. Move or rename it and retry." }
    $passLog = Join-Path $env:TEMP ("bootleg-pass-" + [guid]::NewGuid().ToString('N'))
    Write-Host "Compressing $([IO.Path]::GetFileName($source)) to roughly $TargetMB MiB (H.264 MP4, 720p maximum)."
    Write-Host 'Two encoding passes may take a while. Your original is preserved.'
    $common = @('-hide_banner', '-i', $source, '-map', '0:v:0', '-c:v', 'libx264', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-vf', 'scale=-2:trunc(min(ih\,720)/2)*2', '-b:v', "${videoKbps}k", '-passlogfile', $passLog)
    try {
        & ffmpeg @common -an -pass 1 -f null NUL
        if ($LASTEXITCODE -ne 0) { throw 'The first encoding pass failed.' }
        & ffmpeg @common -map '0:a:0?' -c:a aac -b:a "${audioKbps}k" -sn -dn -map_metadata -1 -movflags +faststart -pass 2 $output
        if ($LASTEXITCODE -ne 0) { throw 'The second encoding pass failed.' }
        $resultMB = [Math]::Round((Get-Item -LiteralPath $output).Length / 1MB, 1)
        Write-Host "Done: $output ($resultMB MiB)"
        Write-Host 'Check picture and sound before sharing; target size is approximate.'
    } finally {
        foreach ($suffix in @('-0.log', '-0.log.mbtree', '.log', '.log.mbtree')) {
            Remove-Item -LiteralPath "$passLog$suffix" -ErrorAction SilentlyContinue
        }
        if (Test-Path -LiteralPath $output) {
            if ((Get-Item -LiteralPath $output).Length -eq 0 -or $LASTEXITCODE -ne 0) { Remove-Item -LiteralPath $output -ErrorAction SilentlyContinue }
        }
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
