
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchItems() {
    try {
      const response = await axios.get('/api/items');
      setItems(response.data);
      setError('');
    } catch (error) {
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function addItem(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      await axios.post('/api/items', { name: trimmedName });
      setName('');
      await fetchItems();
    } catch (error) {
      setError('Failed to add item.');
    }
  }

  async function deleteItem(id) {
    try {
      await axios.delete(`/api/items/${id}`);
      await fetchItems();
    } catch (error) {
      setError('Failed to delete item.');
    }
  }

  return (
    <main
      style={{
        fontFamily: 'sans-serif',
        maxWidth: 600,
        margin: '40px auto',
        padding: '0 20px'
      }}
    >
      <h1>MERN Docker Demo</h1>
      <p>Add items and save them in MongoDB.</p>

      <form
        onSubmit={addItem}
        style={{ display: 'flex', gap: 8, marginBottom: 20 }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New item name"
          aria-label="New item name"
          style={{ flex: 1, padding: 8, fontSize: 16 }}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: 10,
                borderBottom: '1px solid #eee'
              }}
            >
              <span>{item.name}</span>
              <button
                type="button"
                onClick={() => deleteItem(item._id)}
                aria-label={`Delete ${item.name}`}
              >
                Delete
              </button>
            </li>
          ))}

          {items.length === 0 && <p>No items yet — add one above.</p>}
        </ul>
      )}
    </main>
  );
}

export default App;
