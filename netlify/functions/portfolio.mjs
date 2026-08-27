import { connectLambda, getStore } from '@netlify/blobs';

export async function handler(event) {
  try {
    connectLambda(event);
    const store = getStore('portfolio');
    const data = await store.get('data', { type: 'json' });
    if (!data) {
      return { statusCode: 204, body: '' };
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return { statusCode: 204, body: '' };
  }
}
