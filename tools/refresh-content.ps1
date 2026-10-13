$ErrorActionPreference = "Stop"
$SiteRoot = Split-Path -Parent $PSScriptRoot
$GalleryRoot = Join-Path $SiteRoot "assets\gallery"
$ProjectRoot = Join-Path $SiteRoot "assets\project-media"
$JsRoot = Join-Path $SiteRoot "js"

function Slugify([string]$text) {
    $slug = $text.ToLowerInvariant() -replace '[^a-z0-9]+','-'
    return $slug.Trim('-')
}
function ExtType([System.IO.FileInfo]$file) {
    return $file.Extension.TrimStart('.').ToLowerInvariant()
}
function WebPath([string]$path) { return ($path -replace '\\','/') }

if (!(Test-Path $GalleryRoot)) { throw "Missing assets/gallery. Restore the assets folder first." }
if (!(Test-Path $ProjectRoot)) { throw "Missing assets/project-media. Restore the assets folder first." }

$gallery = @()
Get-ChildItem $GalleryRoot -Directory | Sort-Object Name | ForEach-Object {
    $folder = $_
    $files = @()
    Get-ChildItem $folder.FullName -File -Recurse | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($SiteRoot.Length + 1)
        $files += [ordered]@{
            name = $_.BaseName
            file = WebPath $relative
            type = ExtType $_
        }
    }
    $gallery += [ordered]@{ slug = Slugify $folder.Name; title = $folder.Name; files = $files }
}

$projects = [ordered]@{}
Get-ChildItem $ProjectRoot -Directory | Sort-Object Name | ForEach-Object {
    $folder = $_
    $files = @()
    Get-ChildItem $folder.FullName -File -Recurse | Sort-Object FullName | ForEach-Object {
        $relativeInside = $_.FullName.Substring($folder.FullName.Length + 1)
        $files += [ordered]@{
            name = $_.BaseName
            file = WebPath ("../assets/project-media/" + $folder.Name + "/" + $relativeInside)
            type = ExtType $_
        }
    }
    $projects[$folder.Name] = $files
}

$galleryJson = $gallery | ConvertTo-Json -Depth 8
$projectJson = $projects | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText((Join-Path $JsRoot 'gallery-data.js'), "window.GALLERY_CATEGORIES = $galleryJson;`r`n", [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $JsRoot 'project-media-data.js'), "window.PROJECT_MEDIA = $projectJson;`r`n", [Text.UTF8Encoding]::new($false))

Write-Host "Bootleg OS content index refreshed." -ForegroundColor Green
Write-Host ("Gallery folders: " + $gallery.Count)
Write-Host ("Project folders: " + $projects.Count)
Write-Host "You can now refresh the website in your browser."
