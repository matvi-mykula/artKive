import sharp from "sharp";

function getArg(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

const input = getArg("--input");
const output = getArg("--output");
const max = Number(getArg("--max", "2200"));
const quality = Number(getArg("--quality", "80"));

if (!input || !output) {
  console.error(
    "Usage: node scripts/optimize-image.mjs --input <source> --output <target> [--max 2200] [--quality 80]",
  );
  process.exit(1);
}

try {
  await sharp(input)
    .rotate()
    .resize({
      width: max,
      height: max,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
    })
    .toFile(output);

  console.log(`Optimized ${input} -> ${output}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
