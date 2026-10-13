import os
import io
import json
import re
import zipfile
import base64
import secrets
import internetarchive as ia
from urllib.parse import quote, urlparse, parse_qs, unquote
from flask import Flask, render_template_string, request, Response

app = Flask(__name__)

# Search results stay server-side so the browser only posts small item IDs.
SEARCH_CACHE = {}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Internet Archive MP4 Extractor</title>

<style>
* {
    box-sizing: border-box;
    font-family: Segoe UI, Arial, sans-serif;
}

body {
    margin: 0;
    background: #0f172a;
    color: #f8fafc;
}

.container {
    max-width: 1100px;
    margin: 40px auto;
    padding: 20px;
}

.card {
    background: #1e293b;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 8px 30px rgba(0,0,0,.35);
}

h1 {
    margin-top: 0;
    color: #38bdf8;
}

p {
    color: #cbd5e1;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
}

input,
select,
button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 8px;
    margin-bottom: 18px;
    font-size: 15px;
}

input,
select {
    background: #334155;
    color: white;
}

button {
    background: #0284c7;
    color: white;
    cursor: pointer;
    font-weight: bold;
}

button:hover {
    background: #0ea5e9;
}

button:disabled {
    background: #475569;
    cursor: not-allowed;
}

.results {
    margin-top: 30px;
    background: #111827;
    border: 2px solid #334155;
    border-radius: 10px;
    padding: 20px;
    min-height: 250px;
}

.result {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #334155;
}

.result:last-child {
    border-bottom: none;
}

.result input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 4px;
    cursor: pointer;
}

.toolbar {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.toolbar button {
    flex: 1;
}

.footer {
    text-align: center;
    margin-top: 20px;
    color: #64748b;
    font-size: 13px;
}

.empty {
    text-align: center;
    color: #94a3b8;
    padding: 80px 0;
}

.loading-overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(15, 23, 42, .86);
    align-items: center;
    justify-content: center;
}

.loading-box {
    text-align: center;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 12px;
    padding: 28px 36px;
    box-shadow: 0 8px 30px rgba(0,0,0,.4);
}

.spinner {
    width: 46px;
    height: 46px;
    margin: 0 auto 16px;
    border: 5px solid #334155;
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin .8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
</head>

<body>

<div class="container">
<div class="card">

<h1>Internet Archive MP4 Extractor</h1>

<p>
Search Internet Archive using a term, collection, uploader profile, <strong>user favourites URL</strong> (e.g. <code>https://archive.org/details/@username/favorites</code>), or item URL. Select entries to download as a <code>.zip</code> file. Text files are formatted for the show parser with <code># Title</code> and <code>## Season</code> headings.
</p>

<!-- Form 1: Search Form -->
<form action="/scrape" method="POST" id="search-form">
    <label>Search or URL</label>
    <input
        name="user_input"
        required
        placeholder="https://archive.org/details/@username/favorites or Spider-Man TAS"
        value="{{ search_term }}">

    <label>Sort Results</label>
    <select name="sort_by">
        <option value="none" {% if sort_by=="none" %}selected{% endif %}>Relevance</option>
        <option value="downloads desc" {% if sort_by=="downloads desc" %}selected{% endif %}>Most Viewed</option>
        <option value="week desc" {% if sort_by=="week desc" %}selected{% endif %}>Most Viewed This Week</option>
        <option value="publicdate desc" {% if sort_by=="publicdate desc" %}selected{% endif %}>Newest Uploads</option>
    </select>

    <button type="submit">Search Internet Archive</button>
</form>

<!-- Form 2: Selection & Download Form -->
<form action="/download_zip" method="POST" id="download-form">
    <input type="hidden" name="search_id" value="{{ search_id }}">

    <div class="results">
        <h2>Search Results</h2>
        {% if results %}
            <p>{{ results|length }} upload(s) with MP4 files found.</p>

            {% for item in results %}
            <div class="result">
                <input 
                    type="checkbox" 
                    name="selected_indexes" 
                    value="{{ item.id }}" 
                    class="series-checkbox"
                    onchange="updateButtonStates()">
                <div>
                    <strong>{{ item.title }}.txt</strong>
                    <br>
                    <span style="color:#94a3b8;">
                        {{ item.links|length }} MP4 link{% if item.links|length != 1 %}s{% endif %}
                    </span>
                </div>
            </div>
            {% endfor %}
        {% else %}
            <div class="empty">
                No search has been performed yet.
            </div>
        {% endif %}
    </div>

    <div class="toolbar">
        <button type="button" id="btn-select-all" onclick="selectAll(true)" {% if not results %}disabled{% endif %}>
            Select All
        </button>
        <button type="button" id="btn-clear" onclick="selectAll(false)" {% if not results %}disabled{% endif %}>
            Clear Selection
        </button>
        <button type="submit" id="btn-download" disabled>
            Download Selected (.ZIP)
        </button>
        <button type="button" id="btn-clear-search" onclick="clearSearch()" {% if not results and not search_term %}disabled{% endif %}>
            Clear Search
        </button>
    </div>
</form>

<div class="footer">
Version 2.0.1 — Clear Search + Safe Bulk Downloads
</div>

</div>
</div>

<div class="loading-overlay" id="loading-overlay">
    <div class="loading-box">
        <div class="spinner"></div>
        <strong id="loading-title">Please wait…</strong>
        <p id="loading-message" style="margin-bottom:0;">Processing Internet Archive data.</p>
    </div>
</div>

<script>
function selectAll(checked) {
    const checkboxes = document.querySelectorAll('.series-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
    updateButtonStates();
}

function updateButtonStates() {
    const checkedCount = document.querySelectorAll('.series-checkbox:checked').length;
    const downloadBtn = document.getElementById('btn-download');
    downloadBtn.disabled = (checkedCount === 0);
}

function clearSearch() {
    // Return the app to a clean starting state without submitting another search.
    window.location.href = "/";
}

function showLoading(title, message) {
    document.getElementById('loading-title').textContent = title;
    document.getElementById('loading-message').textContent = message;
    document.getElementById('loading-overlay').style.display = 'flex';
}

document.getElementById('search-form').addEventListener('submit', function () {
    showLoading('Searching…', 'Please wait while Internet Archive items and MP4 links are checked.');
});

document.getElementById('download-form').addEventListener('submit', function () {
    showLoading('Building ZIP…', 'Formatting your selected text files. Your download will begin shortly.');
    // A normal file-download response does not reload the page, so clear the overlay shortly after submission.
    window.setTimeout(function () {
        document.getElementById('loading-overlay').style.display = 'none';
    }, 3000);
});
</script>

</body>
</html>
"""

def sanitize_filename(filename, max_length=70):
    """Return a short Windows-safe filename stem for files stored inside ZIPs."""
    clean = re.sub(r'[\\/*?:"<>|]', "", str(filename))
    clean = re.sub(r'\s+', " ", clean).strip(" .")
    # Windows also dislikes names ending in a dot/space and has reserved device names.
    if not clean:
        clean = "Archive_Item"
    reserved = {"CON", "PRN", "AUX", "NUL", *(f"COM{i}" for i in range(1, 10)), *(f"LPT{i}" for i in range(1, 10))}
    if clean.upper() in reserved:
        clean = "_" + clean
    if len(clean) > max_length:
        clean = clean[:max_length].rstrip(" ._-")
    return clean or "Archive_Item"

def unique_txt_name(title, used_names):
    """Create a short, safe and unique .txt filename for a ZIP member."""
    stem = sanitize_filename(title, max_length=70)
    candidate = f"{stem}.txt"
    n = 2
    while candidate.casefold() in used_names:
        suffix = f" ({n})"
        trimmed = stem[:max(1, 70 - len(suffix))].rstrip(" ._-")
        candidate = f"{trimmed}{suffix}.txt"
        n += 1
    used_names.add(candidate.casefold())
    return candidate

def encode_b64(data):
    """Safely encode dictionary/list object into base64 string."""
    json_bytes = json.dumps(data).encode("utf-8")
    return base64.b64encode(json_bytes).decode("utf-8")

def decode_b64(b64_str):
    """Safely decode base64 string back into Python dictionary/list."""
    try:
        json_bytes = base64.b64decode(b64_str.encode("utf-8"))
        return json.loads(json_bytes.decode("utf-8"))
    except Exception:
        return []

def extract_mp4_links(item_files, identifier):
    """Helper to extract direct URLs or fall back to safe paths."""
    links = []
    for f in item_files:
        if f.get("name", "").lower().endswith(".mp4"):
            # Option A: Use direct server URL provided by IA metadata if present
            if "url" in f:
                links.append(f["url"])
            else:
                # Option B: Reconstruct standard direct download link
                clean_name = quote(f["name"].lstrip("/"), safe="/")
                links.append(f"https://archive.org/download/{identifier}/{clean_name}")
    return links


def detect_season(filename):
    """Return a season number when a common TV filename pattern can be recognised."""
    decoded = unquote(filename)
    patterns = [
        r'(?i)(?:^|[\s._\-/\[\(])S(?:eason)?[ ._-]*0*(\d{1,2})(?:E|[\s._\-/\]\)])',
        r'(?i)Season[ ._-]*0*(\d{1,2})',
        r'(?i)Series[ ._-]*0*(\d{1,2})',
    ]
    for pattern in patterns:
        m = re.search(pattern, decoded)
        if m:
            try:
                return int(m.group(1))
            except ValueError:
                pass
    return None

def make_parser_text(title, links):
    """Format one IA item for the TV parser: # title, ## season, then MP4 URLs."""
    groups = {}
    ungrouped = []
    for link in links:
        filename = link.rsplit('/', 1)[-1]
        season = detect_season(filename)
        if season is None:
            ungrouped.append(link)
        else:
            groups.setdefault(season, []).append(link)

    lines = [f"# {title}", ""]

    if groups:
        for season in sorted(groups):
            lines.append(f"## Season {season}")
            lines.extend(groups[season])
            lines.append("")
        if ungrouped:
            lines.append("## Specials / Unsorted")
            lines.extend(ungrouped)
            lines.append("")
    else:
        # If no season pattern is present, keep the item parser-friendly without inventing a season.
        lines.extend(ungrouped)
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"

@app.route("/")
def home():
    return render_template_string(
        HTML_TEMPLATE,
        results=[],
        search_id="",
        search_term="",
        sort_by="none"
    )

@app.route("/scrape", methods=["POST"])
def scrape():
    raw = request.form.get("user_input", "").strip()
    sort = request.form.get("sort_by", "none")

    if not raw:
        return render_template_string(
            HTML_TEMPLATE,
            results=[],
            search_id="",
            search_term="",
            sort_by=sort
        )

    mode = None
    query = None
    ident = None

    # Internet Archive stores a user's favourites as the virtual collection fav-<username>.
    # Check this BEFORE the normal @username uploader-profile rule.
    if ("archive.org/details/@" in raw and "/favorites" in raw.lower()) or raw.lower().startswith("fav-"):
        mode = "favorites"
        if raw.lower().startswith("fav-"):
            handle = raw[4:].split("/")[0].split("?")[0]
        else:
            handle = raw.split("@")[-1].split("/")[0].split("?")[0]
        query = f'collection:fav-{handle}'
    elif "archive.org/details/@" in raw or raw.startswith("@"):
        mode = "uploader"
        handle = raw.split("@")[-1].split("/")[0].split("?")[0]
        query = f'_uploader_useritem:@{handle}'
    elif "archive.org/details/" in raw:
        mode = "direct"
        ident = raw.split("/details/")[1].split("/")[0].split("?")[0]
    elif "archive.org/download/" in raw:
        mode = "direct"
        ident = raw.split("/download/")[1].split("/")[0]
    elif "archive.org/search" in raw and "query=" in raw:
        mode = "query"
        parsed = urlparse(raw)
        query = unquote(parse_qs(parsed.query).get("query", [""])[0])
    elif raw.lower().startswith("collection:"):
        mode = "collection"
        ident = raw.split(":", 1)[1].strip()
        query = f"collection:{ident}"
    elif raw.startswith("https://archive.org"):
        mode = "direct"
        ident = raw.rstrip("/").split("/")[-1]
    else:
        mode = "query"
        query = raw if any(ch in raw for ch in [":", "AND", "OR", "(", ")"]) else f"({raw})"

    results_list = []
    
    # SECTION 1: Direct Item Extraction
    if mode == "direct":
        try:
            item = ia.get_item(ident)
            title = sanitize_filename(item.metadata.get("title", ident))
            links = extract_mp4_links(item.files, ident)
            if links:
                results_list.append({
                    "id": 0,
                    "title": title,
                    "links": links
                })
        except Exception:
            pass
            
    # SECTION 2: Bulk Search / Query Extraction
    else:
        sort_param = None if sort == "none" else [sort]
        
        try:
            results = ia.search_items(query, sorts=sort_param)
            count = 0
            for r in results:
                identifier = r.get("identifier")
                if not identifier:
                    continue
                try:
                    item = ia.get_item(identifier)
                    title = sanitize_filename(item.metadata.get("title", identifier))
                    links = extract_mp4_links(item.files, identifier)
                    if links:
                        results_list.append({
                            "id": count,
                            "title": title,
                            "links": links
                        })
                        count += 1
                except Exception:
                    continue
        except Exception:
            pass

    # Keep the potentially huge URL payload on the server. The page only receives
    # a short cache key plus the tiny numeric IDs used by the checkboxes.
    search_id = secrets.token_urlsafe(16)
    SEARCH_CACHE[search_id] = results_list

    # This is a local desktop app, but cap old searches so repeated use does not
    # grow memory forever.
    while len(SEARCH_CACHE) > 10:
        SEARCH_CACHE.pop(next(iter(SEARCH_CACHE)))

    return render_template_string(
        HTML_TEMPLATE,
        results=results_list,
        search_id=search_id,
        search_term=raw,
        sort_by=sort
    )

@app.route("/download_zip", methods=["POST"])
def download_zip():
    search_id = request.form.get("search_id", "")
    selected_indexes = [int(x) for x in request.form.getlist("selected_indexes") if x.isdigit()]

    all_results = SEARCH_CACHE.get(search_id, [])
    if not all_results:
        return Response(
            "Search results expired or were not found. Please run the search again.",
            status=400,
            mimetype="text/plain"
        )

    # Filter out selected items
    selected_items = [item for item in all_results if item.get("id") in selected_indexes]

    zip_buffer = io.BytesIO()

    used_names = set()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for item in selected_items:
            links = item.get("links", [])
            title = item.get("title", "Archive_Item")
            file_content = make_parser_text(title, links)
            # Keep the full title inside the text file, but use a short Windows-safe
            # filename in the ZIP to avoid Explorer's "Path too long" extraction error.
            txt_name = unique_txt_name(title, used_names)
            zip_file.writestr(txt_name, file_content)

    zip_buffer.seek(0)

    # Keep the bulk archive name deliberately short and predictable.
    zip_name = "New-Links"

    return Response(
        zip_buffer.getvalue(),
        mimetype="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_name}.zip"'}
    )

if __name__ == "__main__":
    app.run(port=5000, debug=True)