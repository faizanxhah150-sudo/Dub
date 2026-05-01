import Head from 'next/head';
import NeuralDubStudio from '../components/NeuralDubStudio';

export default function Home() {
  return (
    <>
      <Head>
        <title>Neural Dub Studio — AI Dubbing Engine</title>
        <meta name="description" content="Professional AI-powered video dubbing and lip-sync engine. Supports 13 languages including Urdu." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />

        {/* Open Graph */}
        <meta property="og:title"       content="Neural Dub Studio" />
        <meta property="og:description" content="AI Dubbing Engine — Whisper + XTTS + Wav2Lip" />
        <meta property="og:type"        content="website" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Google Fonts used by the dashboard */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <NeuralDubStudio />
    </>
  );
}
