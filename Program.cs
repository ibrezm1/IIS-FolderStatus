var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Minimal endpoint to get real folder metadata without complex models
app.MapGet("/api/folder-info", () =>
{
    var folderPath = app.Configuration["FolderPath"] ?? @"C:\MyFolder";

    if (!Directory.Exists(folderPath))
    {
        return Results.Json(new
        {
            folder = folderPath,
            lastModified = "N/A",
            exists = false,
            message = "Directory not found"
        }, statusCode: 404);
    }

    var folder = new DirectoryInfo(folderPath);

    return Results.Json(new
    {
        folder = folder.FullName,
        lastModified = folder.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss"),
        exists = true,
        message = "Active"
    });
});

app.Run();
