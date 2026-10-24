$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -Path $compiler)) {
    $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe'
}
$frameworkRoot = Split-Path $compiler
$refs = @(
    (Join-Path $frameworkRoot 'WPF\PresentationFramework.dll'),
    (Join-Path $frameworkRoot 'WPF\WindowsBase.dll'),
    (Join-Path $frameworkRoot 'WPF\PresentationCore.dll'),
    (Join-Path $frameworkRoot 'System.Xaml.dll')
)
$output = Join-Path $root 'DeepSeekWhaleWidget.exe'
$source = Join-Path $root 'DeepSeekWhaleWidget.cs'
$referenceArgs = $refs | ForEach-Object { '/reference:' + $_ }
$icon = Join-Path $root 'tray-icon.ico'
$iconArg = if (Test-Path $icon) { "/win32icon:$icon" } else { "" }
& $compiler /nologo /target:winexe /optimize+ /warnaserror+ /out:$output $iconArg @referenceArgs $source
if ($LASTEXITCODE -ne 0) { throw "Compilation failed with exit code $LASTEXITCODE." }
Write-Output "Built $output"

