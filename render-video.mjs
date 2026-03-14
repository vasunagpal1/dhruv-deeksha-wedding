import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, "output");
const scenePath = path.join(__dirname, "scene.html");

function transcodeToMp4(inputPath, outputPath) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path.");
  }

  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        outputPath
      ],
      {
        stdio: ["ignore", "ignore", "pipe"]
      }
    );

    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true
});

try {
  const page = await browser.newPage({
    viewport: {
      width: 1920,
      height: 1080
    },
    deviceScaleFactor: 1
  });

  await page.goto(`file://${scenePath}`, {
    waitUntil: "load"
  });

  const result = await page.evaluate(async () => {
    return window.aiLoop.recordLoop({
      duration: window.aiLoop.config.duration,
      fps: window.aiLoop.config.fps
    });
  });

  const extension = result.mimeType.includes("webm") ? "webm" : "bin";
  const outputPath = path.join(outputDir, `futuristic-ai-loop.${extension}`);
  const mp4Path = path.join(outputDir, "futuristic-ai-loop.mp4");
  const buffer = Buffer.from(result.base64, "base64");

  await writeFile(outputPath, buffer);
  await transcodeToMp4(outputPath, mp4Path);
  console.log(outputPath);
  console.log(mp4Path);
} finally {
  await browser.close();
}
