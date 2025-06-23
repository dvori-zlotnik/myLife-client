import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001/api';

export default function DailyManager() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [addingForTomorrow, setAddingForTomorrow] = useState(false);
  const [editingDayId, setEditingDayId] = useState(null);
  const [editDayNote, setEditDayNote] = useState('');
  // עריכת תיאור משימה - לוקאלי בלבד עד שמירה
  const [taskEditState, setTaskEditState] = useState({});

  useEffect(() => {
    fetchDays();
  }, []);

  const fetchDays = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/days`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDays(Array.isArray(data) ? data.reverse() : []); // הצג ימים מהחדש לישן
      setError(null);
    } catch (err) {
      setDays([]); // אם יש שגיאה, נניח שאין ימים
      setError(null); // לא מציגים שגיאה
    }
    setLoading(false);
  };

  const handleAddTask = async () => {
    if (!newTask) return;
    try {
      await fetch(`${API_URL}/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask,description:"" })
      });
      setNewTask('');
      setAddingForTomorrow(false);
      fetchDays();
    } catch {
      setError('שגיאה בהוספת משימה');
    }
  };

  const handleAddNote = async () => {
    if (!newNote) return;
    try {
      await fetch(`${API_URL}/day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote })
      });
      setNewNote('');
      fetchDays();
    } catch {
      setError('שגיאה בהוספת פתק');
    }
  };

  const handleTaskUpdate = async (dayId, taskId, updates) => {
    try {
      await fetch(`${API_URL}/update-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, taskId, ...updates })
      });
      fetchDays();
    } catch {
      setError('שגיאה בעדכון משימה');
    }
  };

  const handleEditDay = (day) => {
    setEditingDayId(day._id);
    setEditDayNote(day.notes || '');
  };

  const handleSaveDayNote = async (dayId) => {
    try {
      await fetch(`${API_URL}/update-day`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, note: editDayNote })
      });
      setEditingDayId(null);
      setEditDayNote('');
      fetchDays();
    } catch {
      setError('שגיאה בעדכון תיאור יום');
    }
  };

  const handleCancelEdit = () => {
    setEditingDayId(null);
    setEditDayNote('');
  };

  const handleTaskDescChange = (taskId, value) => {
    setTaskEditState(prev => ({ ...prev, [taskId]: value }));
  };

  const handleTaskDescSave = async (dayId, taskId) => {
    const newDesc = taskEditState[taskId] || '';
    try {
      await fetch(`${API_URL}/update-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, taskId, description: newDesc })
      });
      setTaskEditState(prev => ({ ...prev, [taskId]: undefined }));
      fetchDays();
    } catch {
      setError('שגיאה בעדכון תיאור משימה');
    }
  };

  const handleDeleteTask = async (dayId, taskId) => {
    try {
      await fetch(`${API_URL}/delete-task`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, taskId })
      });
      fetchDays();
    } catch {
      setError('שגיאה במחיקת משימה');
    }
  };

  if (loading) return <div>טוען...</div>;

  return (
    <div style={{ maxWidth: 600, margin: 'auto', direction: 'rtl' }}>
      <h2>ניהול סדר יום</h2>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="הוסף משימה..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          style={{ width: '60%' }}
        />
        <label>
          <input
            type="checkbox"
            checked={addingForTomorrow}
            onChange={e => setAddingForTomorrow(e.target.checked)}
          />
          הוסף למחר
        </label>
        <button onClick={handleAddTask}>הוסף משימה</button>
      </div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="הוסף תיאור כללי ליום..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          style={{ width: '60%' }}
        />
        <button onClick={handleAddNote}>הוסף תיאור</button>
      </div>
      {days.length === 0 && (
        <div style={{ color: '#888', margin: '32px 0' }}>
          אין ימים להצגה עדיין. הוסף משימה או תיאור כדי להתחיל!
        </div>
      )}
      {days.map(day => (
        <div key={day._id} className="day-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="day-date">{new Date(day.date).toLocaleDateString('he-IL')}</div>
            <button style={{ fontSize: 14, padding: '4px 10px' }} onClick={() => handleEditDay(day)}>
              ערוך תיאור יום
            </button>
          </div>
          {editingDayId === day._id ? (
            <div style={{ margin: '12px 0' }}>
              <input
                type="text"
                value={editDayNote}
                onChange={e => setEditDayNote(e.target.value)}
                style={{ width: '80%' }}
              />
              <button onClick={() => handleSaveDayNote(day._id)} style={{ marginRight: 8 }}>שמור</button>
              <button onClick={handleCancelEdit} style={{ background: '#eee', color: '#333' }}>ביטול</button>
            </div>
          ) : (
            <div className="day-notes">{day.notes}</div>
          )}
          <ul className="task-list">
            {day.tasks.map(task => {
              const localDesc = taskEditState[task._id];
              const descChanged = typeof localDesc === 'string' && localDesc !== (task.description || '');
              return (
                <li key={task._id} className={`task-item${task.completed ? ' completed' : ''}`}> 
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={e => handleTaskUpdate(day._id, task._id, { completed: e.target.checked })}
                  />
                  <span style={{ marginRight: 8, fontWeight: 500, color: '#6366f1', minWidth: 60 }}>{task.title}</span>
                  <input
                    type="text"
                    value={typeof localDesc === 'string' ? localDesc : (task.description || '')}
                    placeholder="הוסף תיאור..."
                    onChange={e => handleTaskDescChange(task._id, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {descChanged && (
                    <button style={{ marginRight: 8 }} onClick={() => handleTaskDescSave(day._id, task._id)}>שמור</button>
                  )}
                  <button style={{ marginRight: 8, background: '#f87171', color: '#fff' }} onClick={() => handleDeleteTask(day._id, task._id)}>מחק</button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
