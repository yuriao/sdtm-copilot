import React from 'react'

export default function StepIndicator({ steps, current, onJump, jumpable }) {
  // jumpable: array of step indices the user is allowed to jump to
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 24,
      overflowX: 'auto',
      padding: '4px 0',
    }}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        const canJump = jumpable && jumpable.includes(i) && !active

        return (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 70,
            }}>
              <div
                onClick={() => canJump && onJump && onJump(i)}
                title={canJump ? `Go to ${label}` : undefined}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: done ? '#27ae60' : active ? '#1a3a5c' : '#d5dde5',
                  color: done || active ? '#fff' : '#7f8c8d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  transition: 'background 0.2s, transform 0.1s',
                  cursor: canJump ? 'pointer' : 'default',
                  ...(canJump ? { boxShadow: '0 0 0 2px #27ae60', transform: 'scale(1.08)' } : {}),
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <div style={{
                fontSize: '0.72rem',
                marginTop: 4,
                color: active ? '#1a3a5c' : done ? '#27ae60' : '#95a5a6',
                fontWeight: active ? 700 : 400,
                whiteSpace: 'nowrap',
                cursor: canJump ? 'pointer' : 'default',
                textDecoration: canJump ? 'underline dotted' : 'none',
              }}
              onClick={() => canJump && onJump && onJump(i)}
              >
                {label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: 3,
                background: done ? '#27ae60' : '#d5dde5',
                margin: '0 2px',
                marginBottom: 20,
                minWidth: 10,
                transition: 'background 0.2s',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
