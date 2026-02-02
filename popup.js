const statusMsg = (text, type) => {
    const el = document.getElementById('status');
    el.innerText = text;
    el.className = type === 'error' ? 'status-error' : 'status-success';
    setTimeout(() => { el.className = ''; el.style.display = 'none'; }, 4000);
};

const isValidToken = (t) => {
    return /[\w-]{24,}\.[\w-]{6,}\.[\w-]{25,}/.test(t);
};

document.getElementById('getBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("discord.com")) {
        statusMsg("ERROR: NAVIGATE TO DISCORD", "error");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            try {
                let t = document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token || localStorage.getItem('token');
                return t ? t.replace(/"/g, '').trim() : null;
            } catch (e) { return null; }
        }
    }, (results) => {
        const token = results[0]?.result;
        if (token) {
            navigator.clipboard.writeText(token);
            statusMsg("TOKEN CAPTURED SUCCESSFULLY", "success");
        } else {
            statusMsg("ERROR: TOKEN NOT FOUND", "error");
        }
    });
});

document.getElementById('loginBtn').addEventListener('click', async () => {
    let token = document.getElementById('tokenInput').value.trim().replace(/^"|"$/g, '');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!token) {
        statusMsg("ERROR: INPUT EMPTY", "error");
        return;
    }

    if (!isValidToken(token)) {
        statusMsg("ERROR: INVALID FORMAT", "error");
        return;
    }

    statusMsg("INJECTING TOKEN...", "success");

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (t) => {
            const formattedToken = `"${t}"`;
            window.stop();
            localStorage.clear();
            sessionStorage.clear();

            try {
                const i = document.createElement('iframe');
                document.body.appendChild(i);
                i.contentWindow.localStorage.token = formattedToken;
                localStorage.setItem('token', formattedToken);
                setTimeout(() => { window.location.href = "https://discord.com/app"; }, 150);
            } catch (e) { console.error(e); }
        },
        args: [token]
    });
});