Perfect. The publish worked. Your output contains the expected deployment artifacts: FolderDateApp.dll, .deps.json, .runtimeconfig.json, appsettings.json, web.config, and wwwroot. Those are consistent with a published .NET application.

Before touching IIS, let's prove the published build itself works.

1. Run the published app directly

From your current project directory:

cd .\publish


Then:

dotnet .\FolderDateApp.dll


You should get output containing something like:

Now listening on: http://localhost:5000
Application started.


Use the actual URL displayed in your console and open it in the browser.

Also test

If your backend uses /api/folder:

http://localhost:5000/api/folder


Use whatever port the terminal actually reports.

2. Check your frontend was published

Your wwwroot directory exists, which is good. Check its contents:

Get-ChildItem .\wwwroot -Recurse


You want to find:

wwwroot
│
├── index.html
│
├── css
│   └── site.css
│
└── js
    └── app.js


If those are present and the site works when running FolderDateApp.dll, we're ready for IIS.

3. Stop the test app

Press:

Ctrl+C


Then return to your project:

cd ..


You should now be back at:

C:\Projects\git-projects\FolderDateApp

4. Open PowerShell as Administrator

This is the step that was missing when you got:

Access to the path
'C:\inetpub\FolderDateApp\'
is denied.


Open Start, search for PowerShell, and select Run as administrator.

Then:

cd C:\Projects\git-projects\FolderDateApp


Create the IIS directory:

New-Item -ItemType Directory `
    -Path "C:\inetpub\FolderDateApp" `
    -Force

5. Copy the known-good published application

Since you've already successfully published, don't publish again.

Copy what you already have:

Copy-Item `
    ".\publish\*" `
    "C:\inetpub\FolderDateApp" `
    -Recurse `
    -Force


Now check:

Get-ChildItem C:\inetpub\FolderDateApp


It should closely resemble the list you just showed me.

6. Important: don't repeatedly publish into .\publish

There's one minor improvement I'd make to your deployment process.

Microsoft documents that for web projects, putting the output directory directly under the project can cause subsequent publishes to produce nested output content unless that output directory is excluded from the project.

So rather than repeatedly doing:

dotnet publish -c Release -o .\publish


I'd eventually use something outside the source tree, for example:

dotnet publish -c Release `
    -o C:\Temp\FolderDateApp-publish


Then deploy:

Source
  │
  │ dotnet publish
  ▼
C:\Temp\FolderDateApp-publish
  │
  │ elevated copy
  ▼
C:\inetpub\FolderDateApp
  │
  ▼
IIS
  │
  ▼
http://localhost:8080


For the moment, though, don't change anything. Your publish output is there.

Your next command

Run:

cd .\publish
dotnet .\FolderDateApp.dll


If you paste the output from that, we can determine whether the application itself is healthy before configuring IIS.

Yes. Copying the files into C:\inetpub\FolderDateApp is only the deployment step. You still need to register the application in IIS, set its binding, and ensure IIS can access both the application directory and monitored folder.

1. Confirm the .NET Hosting Bundle

Your project targets .NET 9, so install the matching ASP.NET Core Hosting Bundle if it isn't already installed. The Hosting Bundle installs the .NET runtime and ASP.NET Core Module that allow ASP.NET Core applications to run through IIS.

If you installed IIS after installing the Hosting Bundle, rerun or repair the Hosting Bundle installation.

Then open PowerShell as Administrator:

iisreset

2. Create an application pool

Open IIS Manager:

Win + R → inetmgr


Then:

Select Application Pools.
Click Add Application Pool.
Enter:
Name:FolderDateApp
.NET CLR version: No Managed Code
Managed pipeline mode: Integrated
Click OK.

A separate application pool isolates your app’s worker process from other IIS applications.

3. Create the website

In IIS Manager:

Right-click Sites.
Click Add Website.
Configure:
Site name:       FolderDateApp
Application pool: FolderDateApp
Physical path:   C:\inetpub\FolderDateApp
Binding type:    http
IP address:      All Unassigned
Port:            8080
Host name:       leave blank

Click OK.

Make sure no other IIS site already uses port 8080 with the same IP and host-name combination.

4. Grant permission to the application files

Open PowerShell as Administrator:

icacls "C:\inetpub\FolderDateApp" `
  /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX" `
  /T


IIS supports granting permissions to the dynamically created application-pool identity using the IIS AppPool\<pool-name> format.

5. Grant permission to the monitored folder

If appsettings.json contains:

{
  "FolderPath": "C:\\MyFolder"
}


grant the application pool access:

icacls "C:\MyFolder" `
  /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX" `
  /T


Use your real monitored-folder path instead of C:\MyFolder.

Because your app only reads folder metadata, RX is enough. It doesn't need Modify or Full Control.

6. Verify appsettings.json

Check the deployed copy, not only your source copy:

Get-Content "C:\inetpub\FolderDateApp\appsettings.json"


Confirm the property matches what your C# expects.

If your code uses:

app.Configuration["FolderPath"]


use:

{
  "FolderPath": "C:\\MyFolder"
}


If the code uses:

configuration["FolderMonitor:Path"]


use:

{
  "FolderMonitor": {
    "Path": "C:\\MyFolder"
  }
}

7. Start and browse the site

In IIS Manager:

Select Sites → FolderDateApp.
Click Start in the Actions panel.
Click Browse *:8080 (http).

Or open:

http://localhost:8080


Also test:

http://localhost:8080/api/folder


If the API returns JSON but the page doesn't load correctly, check that these files exist:

C:\inetpub\FolderDateApp\wwwroot\index.html
C:\inetpub\FolderDateApp\wwwroot\css\site.css
C:\inetpub\FolderDateApp\wwwroot\js\app.js

Minimum checklist
Hosting Bundle installed
IIS restarted
FolderDateApp application pool created
FolderDateApp website created
Physical path points to C:\inetpub\FolderDateApp
Port 8080 configured
App pool has read/execute access
App pool can read the monitored folder
Site is started
Browse to http://localhost:8080


& "$env:windir\System32\inetsrv\appcmd.exe" list modules |
    Select-String "AspNetCore"

icacls "C:\Projects\MyData" /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX" /T


Validate production 
Write-Host "`n========== .NET INFO ==========" -ForegroundColor Cyan
dotnet --info

Write-Host "`n========== INSTALLED SDKs ==========" -ForegroundColor Cyan
dotnet --list-sdks

Write-Host "`n========== INSTALLED RUNTIMES ==========" -ForegroundColor Cyan
dotnet --list-runtimes

Write-Host "`n========== ASP.NET CORE RUNTIMES ==========" -ForegroundColor Cyan
dotnet --list-runtimes | Select-String "Microsoft.AspNetCore.App"

Write-Host "`n========== .NET CORE RUNTIMES ==========" -ForegroundColor Cyan
dotnet --list-runtimes | Select-String "Microsoft.NETCore.App"

Write-Host "`n========== IIS ASP.NET CORE MODULE ==========" -ForegroundColor Cyan
& "$env:windir\System32\inetsrv\appcmd.exe" list modules |
    Select-String "AspNetCore"

Write-Host "`n========== ASP.NET CORE MODULE DLL ==========" -ForegroundColor Cyan
$ancm = "$env:ProgramFiles\IIS\Asp.Net Core Module\V2\aspnetcorev2.dll"

if (Test-Path $ancm) {
    Get-Item $ancm |
        Select-Object FullName,
            @{N="Version";E={$_.VersionInfo.FileVersion}}
}
else {
    Write-Host "AspNetCoreModuleV2 DLL NOT FOUND" -ForegroundColor Red
}

Write-Host "`n========== WINDOWS VERSION ==========" -ForegroundColor Cyan
Get-ComputerInfo |
    Select-Object WindowsProductName, WindowsVersion, OsBuildNumber

Write-Host "`n========== DONE ==========" -ForegroundColor Green