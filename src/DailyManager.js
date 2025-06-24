import React, { useEffect, useState } from 'react';
import { HDate, Location, HebrewCalendar } from 'hebcal';

const API_URL = process.env.REACT_APP_API_URL;

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
  // סטייט להצגת תיאור משימה
  const [openDescTaskId, setOpenDescTaskId] = useState(null);
  // סטייט לעריכת תיאור משימה
  const [editDescTaskId, setEditDescTaskId] = useState(null);

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
      let date;
      if (addingForTomorrow) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        date = tomorrow.toISOString();
      }
      const body = { title: newTask, description: "" };
      if (date) body.date = date;
      await fetch(`${API_URL}/add-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

  // פונקציה להמרת תאריך לועזי לעברי
  const getHebrewDateString = (dateStr) => {
    try {
      if (!dateStr) return '';
      let dateObj = dateStr;
      if (typeof dateStr === 'string' || typeof dateStr === 'number') {
        dateObj = new Date(dateStr);
      }
      // דיבאג: הדפסה לקונסול
      // eslint-disable-next-line no-console
      console.log('day.date:', dateStr, '->', dateObj);
      if (isNaN(dateObj.getTime())) return '';
      const hd = new HDate(dateObj);
      return hd.render('he');
    } catch {
      return '';
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
            <div className="day-date">
              {new Date(day.date).toLocaleDateString('he-IL')}
              {getHebrewDateString(day.date) && (
                <span style={{ marginRight: 10, color: '#888', fontSize: '0.95em' }}>
                  ({getHebrewDateString(day.date)})
                </span>
              )}
            </div>
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
              const isOpen = openDescTaskId === task._id;
              const isEdit = editDescTaskId === task._id;
              return (
                <li
                  key={task._id}
                  className={`task-item${task.completed ? ' completed' : ''}`}
                  style={{
                    cursor: 'pointer',
                    position: 'relative',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 80, // מרווח לכפתור מחק
                  }}
                  onClick={e => {
                    if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
                    setOpenDescTaskId(isOpen ? null : task._id);
                    setEditDescTaskId(null);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={e => handleTaskUpdate(day._id, task._id, { completed: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ marginRight: 8, fontWeight: 500, color: '#6366f1', minWidth: 60 }}>{task.title}</span>
                  {isOpen && !isEdit && !!task.description && (
                    <span style={{ marginRight: 8, color: '#374151', flex: 1, whiteSpace: 'pre-line', display: 'block', textAlign: 'right' }}>{task.description}</span>
                  )}
                  {isOpen && !isEdit && (
                    <button style={{ marginRight: 8, zIndex: 1 }} onClick={e => { e.stopPropagation(); setEditDescTaskId(task._id); setTaskEditState(prev => ({ ...prev, [task._id]: task.description || '' })); }}>ערוך</button>
                  )}
                  {isOpen && isEdit && (
                    <>
                      <input
                        type="text"
                        value={typeof localDesc === 'string' ? localDesc : (task.description || '')}
                        placeholder="הוסף תיאור..."
                        onChange={e => handleTaskDescChange(task._id, e.target.value)}
                        style={{ flex: 1, marginRight: 8 }}
                        autoFocus
                      />
                      {descChanged && (
                        <button style={{ marginRight: 8, zIndex: 1 }} onClick={e => { e.stopPropagation(); handleTaskDescSave(day._id, task._id); setEditDescTaskId(null); }}>שמור</button>
                      )}
                      <button style={{ marginRight: 8, zIndex: 1 }} onClick={e => { e.stopPropagation(); setEditDescTaskId(null); }}>ביטול</button>
                    </>
                  )}
                  <button
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: '#f87171', color: '#fff', minWidth: 56, zIndex: 2 }}
                    onClick={e => { e.stopPropagation(); handleDeleteTask(day._id, task._id); }}
                  >
                    מחק
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
