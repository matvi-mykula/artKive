const audioModules = import.meta.glob("../public/audio/*.{mp3,MP3,m4a,M4A,wav,WAV,aac,AAC}", {
  eager: true,
  query: "?url",
  import: "default",
});

const vignetteModules = import.meta.glob(
  "../public/vignettes/*.{mp4,MP4,webm,WEBM}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

function publicAssetPath(modulePath) {
  return modulePath.replace("../public", "");
}

function resolveVignette(vignette) {
  if (!vignette) {
    return null;
  }

  const modulePath = `../public/vignettes/${vignette.fileName}`;
  const src = vignetteModules[modulePath];

  if (!src) {
    return null;
  }

  return {
    src: publicAssetPath(String(src)),
    fit: vignette.fit ?? "contain",
    aspectRatio: vignette.aspectRatio ?? "auto",
  };
}

const trackDefinitions = [
  {
    id: "cc-call-and-response",
    title: "CCCallandresponse",
    fileName: "CCCallandresponse.mp3",
    vignette: {
      fileName: "cc-call-and-response-vignette.mp4",
      fit: "contain",
      aspectRatio: "9 / 16",
    },
  },
  {
    id: "let-the-sparkling-do-the-talking",
    title: "Let The Sparkling Do The Talking",
    fileName: "LetTheSparklingDoTheTalking.mp3",
  },
  {
    id: "bar-in-the-sky",
    title: "Bar In The Sky",
    fileName: "BarInTheSky.mp3",
  },
  {
    id: "blind-biiko",
    title: "Blind Biiko",
    fileName: "BlindBiiko.mp3",
  },
];

export const siteAudioTracks = trackDefinitions
  .map((track) => {
    const modulePath = `../public/audio/${track.fileName}`;
    const src = audioModules[modulePath];

    if (!src) {
      return null;
    }

    return {
      id: track.id,
      title: track.title,
      src: publicAssetPath(String(src)),
      vignette: resolveVignette(track.vignette),
    };
  })
  .filter(Boolean);
