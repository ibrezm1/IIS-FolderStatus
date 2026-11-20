# FolderDateApp — Deployment Guide

Deployment guide for publishing a .NET 9 ASP.NET Core application and hosting it under Internet Information Services (IIS).

---

## 1. Prerequisites

### 1.1 IIS Features

Enable IIS via **Turn Windows features on or off**:

- **Internet Information Services**
- **World Wide Web Services**

### 1.2 .NET Hosting Bundle

Install the **.NET Hosting Bundle** matching the target runtime (.NET 9.0):

- [Download .NET Hosting Bundle](https://dotnet.microsoft.com/download/dotnet)

The Hosting Bundle installs the ASP.NET Core Module (`AspNetCoreModuleV2`) required for IIS hosting.

> [!NOTE]
> If IIS was installed **after** the Hosting Bundle, rerun or repair the Hosting Bundle installation, then restart IIS.

### 1.3 Restart IIS

```powershell
iisreset
```

---

## 2. Publish the Application

Publish a Release build to a temporary output directory outside the source tree:

```powershell
dotnet publish -c Release -o C:\Temp\FolderDateApp-publish
```

Expected output artifacts:

- `FolderDateApp.dll`
- `FolderDateApp.deps.json`
- `FolderDateApp.runtimeconfig.json`
- `appsettings.json`
- `web.config`
- `wwwroot/`

---

## 3. Verify the Published Build

Before configuring IIS, confirm the published application runs correctly.

### 3.1 Run the published application

```powershell
cd C:\Temp\FolderDateApp-publish
dotnet FolderDateApp.dll
```

Expected console output:

```text
Now listening on: http://localhost:5000
Application started.
```

Open the URL reported in the console.

### 3.2 Test the API endpoint

```text
http://localhost:5000/api/folder-info
```

### 3.3 Verify frontend assets

```powershell
Get-ChildItem .\wwwroot -Recurse
```

Expected structure:

```text
wwwroot
├── index.html
├── css
│   └── style.css
└── js
    └── app.js
```

### 3.4 Stop the test application

Press `Ctrl+C`, then return to the project directory:

```powershell
cd C:\Projects\git-projects\FolderDateApp
```

---

## 4. Deploy to IIS

### 4.1 Open PowerShell as Administrator

The deployment directory `C:\inetpub` requires elevated permissions.

1. Open **Start**
2. Search for **PowerShell**
3. Select **Run as administrator**

### 4.2 Create the IIS directory

```powershell
New-Item -ItemType Directory `
    -Path "C:\inetpub\FolderDateApp" `
    -Force
```

### 4.3 Copy the published application

```powershell
Copy-Item `
    "C:\Temp\FolderDateApp-publish\*" `
    "C:\inetpub\FolderDateApp" `
    -Recurse `
    -Force
```

Verify the deployed files:

```powershell
Get-ChildItem C:\inetpub\FolderDateApp
```

---

## 5. Configure IIS

### 5.1 Create an application pool

1. Open **IIS Manager** (`Win + R` → `inetmgr`)
2. Select **Application Pools**
3. Click **Add Application Pool**
4. Configure:

| Setting | Value |
|---|---|
| Name | `FolderDateApp` |
| .NET CLR version | `No Managed Code` |
| Managed pipeline mode | `Integrated` |

5. Click **OK**

### 5.2 Create the website

1. Right-click **Sites**
2. Click **Add Website**
3. Configure:

| Setting | Value |
|---|---|
| Site name | `FolderDateApp` |
| Application pool | `FolderDateApp` |
| Physical path | `C:\inetpub\FolderDateApp` |
| Binding type | `http` |
| IP address | `All Unassigned` |
| Port | `8080` |
| Host name | *(leave blank)* |

4. Click **OK**

> [!NOTE]
> Ensure no other IIS site already uses port `8080` with the same IP and host-name combination.

---

## 6. Configure Permissions

### 6.1 Application directory

Grant read and execute permissions to the application pool identity:

```powershell
icacls "C:\inetpub\FolderDateApp" `
  /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX" `
  /T
```

### 6.2 Monitored folder

Grant read permissions to the folder the application monitors:

```powershell
icacls "C:\Projects\MyData" `
  /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX" `
  /T
```

> [!NOTE]
> The application only reads folder metadata, so `RX` (Read & Execute) is sufficient. `Modify` or `Full Control` is not required.

---

## 7. Verify Configuration

### 7.1 appsettings.json

Check the deployed copy:

```powershell
Get-Content "C:\inetpub\FolderDateApp\appsettings.json"
```

Confirm the `FolderPath` property matches the expected path:

```json
{
  "FolderPath": "C:\\Projects"
}
```

### 7.2 ASP.NET Core Module

Verify the module is registered:

```powershell
& "$env:windir\System32\inetsrv\appcmd.exe" list modules |
    Select-String "AspNetCore"
```

---

## 8. Start and Browse

1. In **IIS Manager**, select **Sites → FolderDateApp**
2. Click **Start** in the Actions panel
3. Click **Browse *:8080 (http)**

Or open directly:

```text
http://localhost:8080
```

Test the API endpoint:

```text
http://localhost:8080/api/folder-info
```

---

## 9. Troubleshooting

### 9.1 500.19 or 502.5 errors

Enable stdout logging by editing `C:\inetpub\FolderDateApp\web.config`:

```xml
<aspNetCore
    processPath="dotnet"
    arguments=".\FolderDateApp.dll"
    stdoutLogEnabled="true"
    stdoutLogFile=".\logs\stdout"
    hostingModel="inprocess" />
```

Check the Windows **Event Viewer** → **Application** log for errors from `IIS AspNetCore Module V2`.

### 9.2 Access denied errors

Ensure PowerShell is running as **Administrator** when creating directories or copying files to `C:\inetpub`.

### 9.3 Frontend not loading

Verify these files exist:

- `C:\inetpub\FolderDateApp\wwwroot\index.html`
- `C:\inetpub\FolderDateApp\wwwroot\css\style.css`
- `C:\inetpub\FolderDateApp\wwwroot\js\app.js`

---

## 10. Deployment Checklist

- [ ] Hosting Bundle installed
- [ ] IIS restarted
- [ ] `FolderDateApp` application pool created
- [ ] `FolderDateApp` website created
- [ ] Physical path points to `C:\inetpub\FolderDateApp`
- [ ] Port `8080` configured
- [ ] Application pool has read/execute access to app directory
- [ ] Application pool can read the monitored folder
- [ ] Site is started
- [ ] Browse to `http://localhost:8080` succeeds

---

## 11. Environment Validation

Run the following script to validate the production environment:

```powershell
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
```
