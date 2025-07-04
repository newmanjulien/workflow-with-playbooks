// app/lib/firestore.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const WORKFLOWS_COLLECTION = 'workflows';

export async function saveWorkflow(workflowData) {
  try {
    const docRef = await addDoc(collection(db, WORKFLOWS_COLLECTION), {
      title: workflowData.title,
      steps: workflowData.steps,
      isRunning: false,
      isPlaybook: workflowData.isPlaybook || false,
      playbook_description: workflowData.playbook_description || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function getWorkflows() {
  try {
    const q = query(
      collection(db, WORKFLOWS_COLLECTION), 
      where('isPlaybook', '==', false),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const workflows = [];
    querySnapshot.forEach((doc) => {
      workflows.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      });
    });
    
    return workflows;
  } catch (error) {
    console.error('Error getting workflows:', error);
    return [];
  }
}

export async function getPlaybooks() {
  try {
    const q = query(
      collection(db, WORKFLOWS_COLLECTION), 
      where('isPlaybook', '==', true),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const playbooks = [];
    querySnapshot.forEach((doc) => {
      playbooks.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to ISO strings for JSON serialization
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      });
    });
    
    return playbooks;
  } catch (error) {
    console.error('Error getting playbooks:', error);
    return [];
  }
}

export async function getWorkflow(id) {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate().toISOString(),
        updatedAt: docSnap.data().updatedAt?.toDate().toISOString()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting workflow:', error);
    return null;
  }
}

export async function updateWorkflow(id, workflowData) {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, id);
    const updateData = {
      title: workflowData.title,
      steps: workflowData.steps,
      updatedAt: serverTimestamp()
    };
    
    // Only update these fields if they are provided
    if (workflowData.hasOwnProperty('isPlaybook')) {
      updateData.isPlaybook = workflowData.isPlaybook;
    }
    if (workflowData.hasOwnProperty('playbook_description')) {
      updateData.playbook_description = workflowData.playbook_description;
    }
    
    await updateDoc(docRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorkflow(id) {
  try {
    await deleteDoc(doc(db, WORKFLOWS_COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkflowStatus(id, isRunning) {
  try {
    const docRef = doc(db, WORKFLOWS_COLLECTION, id);
    await updateDoc(docRef, {
      isRunning: isRunning,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return { success: false, error: error.message };
  }
}
