import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function getValueClass(value) {
  if (value < 70) return 'value-low';
  if (value <= 140) return 'value-range';
  return 'value-high';
}

export default function Readings() {
  const { user } = useAuth();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time_slot: SLOTS[0],
    value: ''
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/readings?limit=100`);
      setReadings(res.data.readings || []);
    } catch (err) {
      showToast('Failed to load readings', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.value && form.value !== 0) {
      e.value = 'Please enter a glucose value.';
    } else {
      const num = Number(form.value);
      if (!Number.isInteger(num) || num < 40 || num > 600) {
        e.value = 'Value must be between 40 and 600 mg/dl.';
      }
    }
    const today = new Date().toISOString().split('T')[0];
    if (form.date > today) {
      e.date = 'Date cannot be in the future.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editing) {
        await axios.put(`${API}/readings/${editing.id}`, form);
        showToast('Reading updated');
      } else {
        await axios.post(`${API}/readings`, form);
        showToast('Reading added');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ date: new Date().toISOString().split('T')[0], time_slot: SLOTS[0], value: '' });
      fetchReadings();
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) {
        if (data.field) setErrors({ [data.field]: data.message });
        else showToast(data.message, true);
      } else {
        showToast('Save failed', true);
      }
    }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setForm({ date: r.date.split('T')[0], time_slot: r.time_slot, value: r.value });
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/readings/${confirmDelete.id}`);
      showToast('Reading deleted');
      setConfirmDelete(null);
      fetchReadings();
    } catch (err) {
      showToast('Delete failed', true);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Readings</h2>
        <button className="btn" style={{ width: 'auto' }} onClick={() => { setShowForm(true); setEditing(null); setForm({ date: new Date().toISOString().split('T')[0], time_slot: SLOTS[0], value: '' }); setErrors({}); }}>
          Add reading
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>{editing ? 'Edit reading' : 'Add reading'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              {errors.date && <div className="error" role="alert">{errors.date}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="slot">Time slot</label>
              <select id="slot" value={form.time_slot} onChange={e => setForm({ ...form, time_slot: e.target.value })}>
                {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.time_slot && <div className="error" role="alert">{errors.time_slot}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="value">Glucose value (mg/dl)</label>
              <input id="value" type="number" min="40" max="600" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
              {errors.value && <div className="error" role="alert">{errors.value}</div>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn" type="submit" style={{ width: 'auto' }}>Save</button>
              <button className="btn btn-secondary" type="button" style={{ width: 'auto' }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="skeleton" style={{ height: '2rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '2rem', marginBottom: '0.5rem' }} />
          <div className="skeleton" style={{ height: '2rem' }} />
        </div>
      ) : readings.length === 0 ? (
        <div className="card empty-state">
          <h3>No readings yet</h3>
          <p>Add your first glucose reading to get started.</p>
          <button className="btn" style={{ width: 'auto', marginTop: '1rem' }} onClick={() => setShowForm(true)}>Add your first reading</button>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>Value (mg/dl)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(r => (
                <tr key={r.id}>
                  <td>{r.date.split('T')[0]}</td>
                  <td>{r.time_slot}</td>
                  <td><span className={`value-chip ${getValueClass(r.value)}`}>{r.value}</span></td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(r)}>Edit</button>
                    {' '}
                    <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: 360 }}>
            <h3>Delete reading?</h3>
            <p>This will permanently remove the {confirmDelete.time_slot} reading on {confirmDelete.date.split('T')[0]}.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-danger" style={{ width: 'auto' }} onClick={handleDelete}>Delete</button>
              <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.isError ? 'error' : ''}`} role="status">
          {toast.msg}
        </div>
      )}
    </div>
  );
}
