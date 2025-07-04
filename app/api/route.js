// app/api/playbooks/route.js
import { getPlaybooks } from '../../lib/firestore';

export async function GET() {
  try {
    const playbooks = await getPlaybooks();
    return Response.json({ playbooks });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch playbooks' }, { status: 500 });
  }
}
