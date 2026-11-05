import fetch from 'node-fetch';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.FREE_GEMINI_API_KEY || '';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data: any = await res.json();
  if (!data.models) {
    console.error('Error:', data);
    return;
  }
  const models = data.models
    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('gemini'))
    .map((m: any) => ({
      name: m.name.replace('models/', ''),
      displayName: m.displayName,
      description: m.description?.slice(0, 80),
    }));
  console.log(`Found ${models.length} Gemini models with generateContent:`);
  console.log(JSON.stringify(models, null, 2));
}

main();
