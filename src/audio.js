function resolveVignette(vignette) {
  if (!vignette) {
    return null;
  }

  return {
    src: `/vignettes/${vignette.fileName}`,
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
    id: "bar-in-the-sky",
    title: "Bar In The Sky",
    fileName: "BarInTheSky.mp3",
  },
  {
    id: "let-the-sparkling-do-the-talking",
    title: "Let The Sparkling Do The Talking",
    fileName: "LetTheSparklingDoTheTalking.mp3",
  },
  {
    id: "blind-biiko",
    title: "Blind Biiko",
    fileName: "BlindBiiko.mp3",
  },
];

export const siteAudioTracks = trackDefinitions
  .map((track) => ({
    id: track.id,
    title: track.title,
    src: `/audio/${track.fileName}`,
    vignette: resolveVignette(track.vignette),
  }));
