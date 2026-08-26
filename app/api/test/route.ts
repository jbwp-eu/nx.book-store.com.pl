export async function GET() {
  const res = await fetch(`https://strapi.book-store.com.pl/api/projects`);

  try {
    const data = await res.json();
    return Response.json({ data });
  } catch (err) {
    console.log(err);
  }
}