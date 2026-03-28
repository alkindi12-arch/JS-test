export async function GET() {
  return new Response('NODE_OK', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
