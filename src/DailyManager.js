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
  // סטייט להעברת משימה
  const [moveTaskState, setMoveTaskState] = useState(null);
  // סטייט לפתיחת פופאפ dvorush
  const [openDvorushDayId, setOpenDvorushDayId] = useState(null);
  // סטייט להדגשת משימת דבורוש שהושלמה
  const [dvorushCongrats, setDvorushCongrats] = useState(null);

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

  // פונקציה להעברת משימה ליום אחר
  const handleMoveTask = async (fromDayId, taskId, toDayId) => {
    try {
      await fetch(`${API_URL}/move-task`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDayId, taskId, toDayId })
      });
      fetchDays();
    } catch {
      setError('שגיאה בהעברת משימה');
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

  const handleDvorushComplete = async (dayId, taskId, completed) => {
    try {
      await fetch(`${API_URL}/dvorush/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, taskId, completed })
      });
      if (completed) {
        setDvorushCongrats(taskId);
        setTimeout(() => setDvorushCongrats(null), 1200);
      }
      fetchDays();
    } catch {
      setError('שגיאה בסימון מטלה ב-dvorush');
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
        <div key={day._id} className="day-card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="day-date">
              {new Date(day.date).toLocaleDateString('he-IL')}
              {getHebrewDateString(day.date) && (
                <span style={{ marginRight: 10, color: '#888', fontSize: '0.95em' }}>
                  ({getHebrewDateString(day.date)})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* איקון לפתיחת dvorush */}
              <button
                title="משימות דבורש"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#6366f1',
                  marginLeft: 8
                }}
                onClick={() => setOpenDvorushDayId(day._id)}
              >
                {/* אפשר להחליף לאייקון SVG אם רוצים */}
                🐝
              </button>
              <button style={{ fontSize: 14, padding: '4px 10px' }} onClick={() => handleEditDay(day)}>
                ערוך תיאור יום
              </button>
            </div>
          </div>
          {/* פופאפ dvorush */}
          {openDvorushDayId === day._id && (
            <div
              style={{
                position: 'fixed',
                top: 0, right: 0, left: 0, bottom: 0,
                background: 'rgba(0,0,0,0.2)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setOpenDvorushDayId(null)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 2px 16px #0002',
                  minWidth: 320,
                  maxWidth: 400,
                  padding: 24,
                  position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  style={{
                    position: 'absolute',
                    top: 8, left: 8,
                    background: 'none',
                    border: 'none',
                    fontSize: 22,
                    cursor: 'pointer',
                    color: '#888'
                  }}
                  onClick={() => setOpenDvorushDayId(null)}
                  title="סגור"
                >×</button>
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>משימות דבורש ליום זה</h3>
                {/* הודעת כל הכבוד */}
                {dvorushCongrats && (
                  <div style={{
                    background: '#fef08a',
                    color: '#b45309',
                    borderRadius: 6,
                    padding: '10px 0',
                    marginBottom: 16,
                    fontWeight: 700,
                    fontSize: '1.1em',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px #0001',
                    animation: 'pop 30s'
                  }}>
                    כל הכבוד!
                  </div>
                )}
                {(!day.dvorush || day.dvorush.length === 0) ? (
                  <div style={{ color: '#888', margin: '16px 0' }}>אין משימות דבורש ליום זה</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {day.dvorush.map(task => (
                      <li
                        key={task._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 10,
                          background: dvorushCongrats === task._id ? '#fef9c3' : undefined,
                          borderRadius: dvorushCongrats === task._id ? 8 : undefined,
                          transition: 'background 0.3s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!task.completed}
                          onChange={e => handleDvorushComplete(day._id, task._id, e.target.checked)}
                          style={{
                            marginLeft: 8,
                            accentColor: dvorushCongrats === task._id ? '#facc15' : undefined,
                            boxShadow: dvorushCongrats === task._id ? '0 0 0 2px #fde047' : undefined,
                            transition: 'accent-color 0.3s, box-shadow 0.3s'
                          }}
                        />
                        <span style={{
                          // אין קו חוצה, במקום זה צבע חזק
                          color: dvorushCongrats === task._id ? '#b45309' : (task.completed ? '#aaa' : '#222'),
                          fontWeight: dvorushCongrats === task._id ? 700 : 400,
                          fontSize: dvorushCongrats === task._id ? '1.08em' : undefined,
                          transition: 'color 0.3s, font-weight 0.3s'
                        }}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span style={{ color: '#666', fontSize: '0.9em', marginRight: 8 }}>
                            {task.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
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
