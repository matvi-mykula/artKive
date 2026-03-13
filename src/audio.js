const audioModules = import.meta.glob("../public/audio/*.{mp3,MP3,m4a,M4A,wav,WAV,aac,AAC}", {
  eager: true,
  query: "?url",
  import: "default",
});

function publicAssetPath(modulePath) {
  return modulePath.replace("../public", "");
}

function toTitle(fileName) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const siteAudioTracks = Object.entries(audioModules)
  .map(([modulePath, url]) => {
    const fileName = modulePath.split("/").pop() ?? "";

    return {
      src: publicAssetPath(String(url)),
      title: toTitle(fileName),
    };
  })
  .sort((left, right) => left.title.localeCompare(right.title, undefined, { sensitivity: "base" }));
