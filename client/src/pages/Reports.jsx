import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function Reports() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('daily');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/reports?type=${type}&date=${date}`);
      setReport(res.data);
    } catch (err) {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date, type]);

  const chartData = report?.readings?.map(r => ({
    name: r.date.split('T')[0] + ' ' + r.time_slot.split(' ')[0],
    value: r.value
  })) || [];

  return (
    <div>
      <h2>Reports</h2>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="rep-date">Selected date</label>
            <input id="rep-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="tabs">
            {['daily', 'weekly', 'mtd', 'monthly'].map(t => (
              <button key={t} className={`tab ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t === 'daily' ? 'Daily' : t === 'weekly' ? 'Weekly' : t === 'mtd' ? 'Month-to-date' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="skeleton" style={{ height: '3rem', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ height: '8rem' }} />
        </div>
      ) : !report || report.count === 0 ? (
        <div className="card empty-state">
          <h3>No data for this period</h3>
          <p>Add some readings to see your stats here.</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="card stat-card">
              <div className="label">Highest</div>
              <div className="value">{report.highest}</div>
            </div>
            <div className="card stat-card">
              <div className="label">Lowest</div>
              <div className="value">{report.lowest}</div>
            </div>
            <div className="card stat-card">
              <div className="label">Average</div>
              <div className="value">{report.average}</div>
            </div>
            <div className="card stat-card">
              <div className="label">Count</div>
              <div className="value">{report.count}</div>
            </div>
            <div className="card stat-card">
              <div className="label">Time in range</div>
              <div className="value">{report.timeInRange}%</div>
            </div>
            <div className="card stat-card">
              <div className="label">High / Low</div>
              <div className="value">{report.highCount} / {report.lowCount}</div>
            </div>
          </div>

          {type === 'daily' && report.readings.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3>Readings on {date}</h3>
              <table>
                <thead><tr><th>Slot</th><th>Value</th></tr></thead>
                <tbody>
                  {report.readings.map(r => (
                    <tr key={r.id}>
                      <td>{r.time_slot}</td>
                      <td>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="card">
              <h3>Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0D9488" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
