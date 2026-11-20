# Next Steps: FolderDateApp Deployment & Configuration

This guide covers running the application locally, publishing it, and configuring it to run under Internet Information Services (IIS).

---

## 1. Configure the Target Folder

By default, the application checks `C:\MyFolder`. You can customize this without recompiling:

- Edit [appsettings.json](file:///C:/Projects/git-projects/FolderDateApp/appsettings.json):
  ```json
  {
    "FolderPath": "C:\\Your\\Target\\Folder"
  }
  ```

---

## 2. Local Testing

Run the development server:

```powershell
dotnet run
```

Open your browser to the URL displayed in the console (e.g. `http://localhost:5000` or `https://localhost:5001`).

---

## 3. IIS Prerequisites

Before hosting in IIS, ensure the following are installed:

1. **IIS Features**:
   - Turn Windows Features on/off &rarr; Check **Internet Information Services** &rarr; **World Wide Web Services**.
2. **.NET Hosting Bundle**:
   - Install the [.NET Hosting Bundle](https://dotnet.microsoft.com/download/dotnet) corresponding to your .NET runtime version (e.g. .NET 9.0).
   - This installs the ASP.NET Core Module (`AspNetCoreModuleV2`) into IIS.
3. Restart IIS if installed after IIS was already running:
   ```powershell
   iisreset
   ```

---

## 4. Publish the Application

Publish the release build to your desired IIS physical path (e.g. `C:\inetpub\FolderDateApp`):

```powershell
dotnet publish -c Release -o C:\inetpub\FolderDateApp
```

---

## 5. Configure IIS

1. Open **IIS Manager** (`inetmgr`).
2. In the **Connections** pane, expand your server node, right-click **Sites**, and click **Add Website...**.
3. Fill in the site details:
   - **Site name**: `FolderDateApp`
   - **Physical path**: `C:\inetpub\FolderDateApp`
   - **Binding Type**: `http`
   - **IP address**: `All Unassigned`
   - **Port**: `8080`
4. Click **OK**.

---

## 6. Configure Permissions

IIS processes run under dedicated Application Pool identities and require appropriate file system permissions.

### A. Published App Folder (`C:\inetpub\FolderDateApp`)
Grant read & execute permissions to the Application Pool:
```powershell
icacls "C:\inetpub\FolderDateApp" /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX"
```

### B. Target Monitored Folder (e.g. `C:\MyFolder`)
Grant read permissions so the app can inspect directory metadata:
```powershell
icacls "C:\MyFolder" /grant "IIS AppPool\FolderDateApp:(OI)(CI)RX"
```

> [!NOTE]
> If monitoring a network share (UNC path like `\\server\share`), the default `ApplicationPoolIdentity` may not have network access. In that case, configure the Application Pool to run under a custom domain/service account with access to the share.

---

## 7. Verify & Troubleshoot

1. Browse to:
   ```text
   http://localhost:8080
   ```
2. **Troubleshooting 500.19 or 502.5 errors**:
   - Enable stdout logging by editing `C:\inetpub\FolderDateApp\web.config`:
     ```xml
     <aspNetCore processPath="dotnet" arguments=".\FolderDateApp.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
     ```
   - Check Windows Event Viewer &rarr; **Application** log for errors from `IIS AspNetCore Module V2`.
