// Centralised toast notification utility
// Uses react-hot-toast — no browser alert() calls anywhere in the app
import toast from 'react-hot-toast'

export const notify = {
  success: (msg: string) => toast.success(msg, {
    style: { background: '#1B4332', color: '#fff', fontSize: '13px', fontWeight: 600, borderRadius: '10px', padding: '10px 16px' },
    iconTheme: { primary: '#C9A84C', secondary: '#1B4332' },
    duration: 3000,
  }),
  error: (msg: string) => toast.error(msg, {
    style: { background: '#7B1D1D', color: '#fff', fontSize: '13px', fontWeight: 600, borderRadius: '10px', padding: '10px 16px' },
    duration: 4000,
  }),
  info: (msg: string) => toast(msg, {
    style: { background: '#0F2D20', color: '#fff', fontSize: '13px', borderRadius: '10px', padding: '10px 16px', border: '1px solid rgba(201,168,76,0.3)' },
    duration: 3000,
  }),
  copy: () => toast.success('Copied to clipboard', {
    style: { background: '#1B4332', color: '#fff', fontSize: '12px', borderRadius: '8px', padding: '8px 14px' },
    duration: 1800,
    icon: '📋',
  }),
}
