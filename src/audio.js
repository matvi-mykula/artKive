const audioModules = import.meta.glob("../public/audio/*.{mp3,MP3,m4a,M4A,wav,WAV,aac,AAC}", {
  eager: true,
  query: "?url",
  import: "default",
});

function publicAssetPath(modulePath) {
  return modulePath.replace("../public", "");
}

const trackDefinitions = [
  {
    id: "cc-call-and-response",
    title: "CCCallandresponse",
    fileName: "CCCallandresponse.mp3",
  },
  {
    id: "let-the-sparkling-do-the-talking",
    title: "Let The Sparkling Do The Talking",
    fileName: "LetTheSparklingDoTheTalking.mp3",
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
    };
  })
  .filter(Boolean);
