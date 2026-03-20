// apps/js/notifications.js - stub for dashboard notifications
document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('notifications-list');
  if (!list) return;
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user._id;
    if (!token || !userId) {
      list.innerHTML = '<li>Log in to see notifications.</li>';
      return;
    }
    const base = (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) || (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:5501/api';
    const res = await fetch(`${base}/notifications?userId=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && Array.isArray(data.notifications) && data.notifications.length) {
      list.innerHTML = data.notifications.slice(0, 5).map(n => `<li>${n.message || n.text || 'Notification'}</li>`).join('');
    } else {
      list.innerHTML = '<li>No notifications yet.</li>';
    }
  } catch (e) {
    list.innerHTML = '<li>No notifications yet.</li>';
  }
});
