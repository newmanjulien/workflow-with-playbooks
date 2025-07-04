import { getWorkflow, updateWorkflow } from '../../../lib/firestore';

export async function GET(request, { params }) {
  try {
    const playbook = await getWorkflow(params.id);
    
    if (playbook) {
      return Response.json({ playbook });
    } else {
      return Response.json({ error: 'Playbook not found' }, { status: 404 });
    }
  } catch (error) {
    return Response.json({ error: 'Failed to fetch playbook' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const result = await updateWorkflow(params.id, body);
    
    if (result.success) {
      return Response.json({ success: true });
    } else {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
