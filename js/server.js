const express = require('express');
const cors = require('cors');
const ytDlp = require('yt-dlp-exec');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// 1. Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// 2. Serve static download files
app.use('/downloads', express.static(downloadsDir));

// 3. Conversion endpoint
app.post('/convert', async (req, res) => {
  const { url, format } = req.body;
  
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const targetFormat = format === 'mp3' ? 'mp3' : 'mp4';
  const outputFilename = `video_${Date.now()}.${targetFormat}`;
  const outputPath = path.join(downloadsDir, outputFilename);

  const options = {
    output: outputPath,
    noWarnings: true,
  };

  if (targetFormat === 'mp3') {
    options.format = 'bestaudio/best';
    options.extractAudio = true;
    options.audioFormat = 'mp3';
  } else {
    options.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
  }

  try {
    await ytDlp(url, options);

    res.json({
      success: true,
      downloadUrl: `http://localhost:3000/downloads/${outputFilename}`
    });
  } catch (err) {
    console.error('yt-dlp error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Converter backend running on http://localhost:3000'));