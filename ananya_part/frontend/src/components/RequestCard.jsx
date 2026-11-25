const colors = { OPEN: '#d97706', ACCEPTED: '#2563eb', DELIVERED: '#16a34a' };

export default function RequestCard({ request, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #ccc', borderRadius: 6, padding: 12, marginBottom: 10 }}>
      <b>#{request.id} {request.type.toUpperCase()}</b> | Urgency: {request.urgency}
      {request.status && (
        <> | Status: <b style={{ color: colors[request.status] }}>{request.status}</b></>
      )}
      <p style={{ margin: '6px 0' }}>Location: {request.location}</p>
      <p style={{ margin: '6px 0' }}>{request.description}</p>
      {request.volunteer && <p style={{ margin: '6px 0' }}>Volunteer: {request.volunteer}</p>}
      {children}
    </div>
  );
}
