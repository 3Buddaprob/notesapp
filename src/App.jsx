import { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);
const client = generateClient();

export default function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', image: null });

  // --- Fetch Notes from API ---
  async function fetchNotes() {
    const { data } = await client.models.Note.list();
    setNotes(data);
  }

  // --- Create a New Note ---
  async function createNote() {
    if (!formData.name || !formData.description) return;

    let imageKey = null;
    if (formData.image) {
      const { key } = await client.storage.put(formData.image.name, formData.image);
      imageKey = key;
    }

    await client.models.Note.create({
      name: formData.name,
      description: formData.description,
      image: imageKey,
    });
    setFormData({ name: '', description: '', image: null });
    fetchNotes();
  }

  // --- Delete a Note ---
  async function deleteNote(id) {
    await client.models.Note.delete({ id });
    fetchNotes();
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ padding: 20 }}>
          <h1>Hello {user.username}</h1>

          <input
            placeholder="Note name"
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            value={formData.name}
          />
          <input
            placeholder="Note description"
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            value={formData.description}
          />
          <input
            type="file"
            onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <button onClick={createNote}>Create Note</button>

          <button onClick={signOut}>Sign Out</button>

          <div>
            {notes.map(note => (
              <div key={note.id} style={{ margin: '1rem 0' }}>
                <h2>{note.name}</h2>
                <p>{note.description}</p>
                {note.image && (
                  <img
                    src={client.storage.get(note.image)}
                    style={{ width: 200 }}
                    alt=""
                  />
                )}
                <button onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            ))}
          </div>
        </main>
      )}
    </Authenticator>
  );
}
