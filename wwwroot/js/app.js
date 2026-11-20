// Dynamic client-side script for FolderDateApp

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    const copyBtn = document.getElementById('copyBtn');
    const folderPathEl = document.getElementById('folderPath');
    const lastModifiedEl = document.getElementById('lastModified');
    const statusTextEl = document.getElementById('statusText');
    const statusBoxEl = document.getElementById('statusBox');
    const statusIndicatorEl = document.getElementById('statusIndicator');
    const badgeStatusTextEl = document.getElementById('badgeStatusText');
    const lastCheckedEl = document.getElementById('lastChecked');

    // Fetch folder information from the server
    async function loadFolderInfo() {
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Checking...';
        }

        try {
            const response = await fetch('/api/folder-info');
            const data = await response.json();

            // Populate real folder path
            folderPathEl.textContent = data.folder;
            folderPathEl.classList.remove('text-muted');

            // Populate real last modified date
            lastModifiedEl.textContent = data.lastModified;

            if (data.exists) {
                statusTextEl.textContent = 'Directory Active';
                statusBoxEl.className = 'fs-5 fw-semibold text-success d-flex align-items-center gap-2';
                statusIndicatorEl.style.backgroundColor = '#10b981';
                badgeStatusTextEl.textContent = 'Active';
            } else {
                statusTextEl.textContent = data.message || 'Folder Not Found';
                statusBoxEl.className = 'fs-5 fw-semibold text-danger d-flex align-items-center gap-2';
                statusIndicatorEl.style.backgroundColor = '#ef4444';
                badgeStatusTextEl.textContent = 'Not Found';
            }
        } catch (error) {
            console.error('Error fetching folder info:', error);
            folderPathEl.textContent = 'Error connecting to server';
            lastModifiedEl.textContent = 'Error';
            statusTextEl.textContent = 'Server Unavailable';
            statusBoxEl.className = 'fs-5 fw-semibold text-danger d-flex align-items-center gap-2';
            statusIndicatorEl.style.backgroundColor = '#ef4444';
            badgeStatusTextEl.textContent = 'Offline';
        } finally {
            updateLastChecked();
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate me-2"></i>Refresh Status';
            }
        }
    }

    function updateLastChecked() {
        if (lastCheckedEl) {
            const now = new Date();
            lastCheckedEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
    }

    // Initial load
    loadFolderInfo();

    // Refresh button event
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadFolderInfo);
    }

    // Copy folder path to clipboard
    if (copyBtn && folderPathEl) {
        copyBtn.addEventListener('click', async () => {
            const textToCopy = folderPathEl.textContent.trim();
            if (!textToCopy || textToCopy.includes('Loading')) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check text-success"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHtml;
                }, 1500);
            } catch (err) {
                console.error('Failed to copy folder path:', err);
            }
        });
    }
});
