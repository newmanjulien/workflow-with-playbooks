import { savePlaybook, getPlaybooks } from '../../lib/firestore';

export async function GET() {
  try {
    const playbooks = await getPlaybooks();
    return Response.json({ playbooks });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch playbooks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await savePlaybook(body);
    
    if (result.success) {
      return Response.json({ success: true, id: result.id });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
