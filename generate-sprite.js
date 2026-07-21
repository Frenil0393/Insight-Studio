#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VIDEO_PATH = process.argv[2] || 'videos/Video-main-60fps.mp4';
const OUTPUT_DIR = process.argv[3] || 'public/scrub';
const FPS = parseInt(process.argv[4]) || 60;
const WIDTH = parseInt(process.argv[5]) || 1920;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎬 Generating 60fps sprite sheet...\n');

const framesDir = path.join(OUTPUT_DIR, 'frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Extract frames
const extractFrames = spawn('ffmpeg', [
  '-i', VIDEO_PATH,
  '-vf', `fps=${FPS},scale=${WIDTH}:-2`,
  '-q:v', '2',
  path.join(framesDir, 'frame_%04d.jpg')
]);

extractFrames.stderr.on('data', () => process.stdout.write('.'));

extractFrames.on('close', (code) => {
  if (code !== 0) {
    console.error('\n❌ Frame extraction failed');
    process.exit(1);
  }

  console.log('\n✅ Frames extracted');
  
  const frames = fs.readdirSync(framesDir).filter(f => f.endsWith('.jpg')).sort();
  const frameCount = frames.length;
  
  console.log(`   Total frames: ${frameCount}`);

  const cols = Math.ceil(Math.sqrt(frameCount));
  const rows = Math.ceil(frameCount / cols);

  const probe = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 ${path.join(framesDir, frames[0])}`).toString().trim().split(',');
  const frameW = parseInt(probe[0]);
  const frameH = parseInt(probe[1]);

  console.log(`   Grid: ${cols}x${rows} | Frame: ${frameW}x${frameH}`);
  console.log('\n🖼️  Assembling sprite...');
  
  const spriteOutput = path.join(OUTPUT_DIR, 'sprite.webp');
  
  const createSprite = spawn('ffmpeg', [
    '-framerate', `${FPS}`,
    '-i', path.join(framesDir, 'frame_%04d.jpg'),
    '-vf', `tile=${cols}x${rows}`,
    '-q:v', '85',
    '-y',
    spriteOutput
  ]);

  createSprite.stderr.on('data', () => process.stdout.write('.'));

  createSprite.on('close', (code) => {
    if (code !== 0) {
      console.error('\n❌ Sprite creation failed');
      process.exit(1);
    }

    console.log('\n✅ Sprite created');

    const manifest = {
      frameCount,
      frameW,
      frameH,
      cols,
      rows,
      fps: FPS,
      spriteW: frameW * cols,
      spriteH: frameH * rows
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    fs.rmSync(framesDir, { recursive: true, force: true });

    const stats = fs.statSync(spriteOutput);
    console.log(`\n📊 Sprite size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('✨ Done!\n');
  });
});