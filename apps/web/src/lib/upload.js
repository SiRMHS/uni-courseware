export function uploadFileWithProgress({ url, file, headers = {}, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", url);

    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(body);
        } else {
          reject(new Error(body.message || `خطا در آپلود (${xhr.status})`));
        }
      } catch {
        reject(new Error("خطا در پردازش پاسخ سرور"));
      }
    };

    xhr.onerror = () => reject(new Error("خطا در اتصال به سرور"));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(formData);
  });
}
