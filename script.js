async function getKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("static-salt"),
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptFile() {
    const file = document.getElementById("fileInput").files[0];
    const password = document.getElementById("password").value;
    if (!file || !password) {
        alert("Please select a file and enter a password.");
        return;
    }

    const key = await getKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileData = await file.arrayBuffer();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        fileData
    );

    const blob = new Blob([iv, new Uint8Array(encrypted)], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = file.name + ".enc";
    link.click();
    document.getElementById("status").innerText = "File encrypted successfully!";
}

async function decryptFile() {
    const file = document.getElementById("fileInput").files[0];
    const password = document.getElementById("password").value;
    if (!file || !password) {
        alert("Please select an encrypted file and enter a password.");
        return;
    }

    const fileData = new Uint8Array(await file.arrayBuffer());
    const iv = fileData.slice(0, 12);
    const encryptedData = fileData.slice(12);
    const key = await getKey(password);

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encryptedData
        );
        const blob = new Blob([decrypted]);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = file.name.replace(".enc", "");
        link.click();
        document.getElementById("status").innerText = "File decrypted successfully!";
    } catch (e) {
        alert("Decryption failed. Wrong password or corrupted file.");
    }
}
