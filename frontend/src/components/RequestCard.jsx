import api from '../api';

// Opens the delivery proof photo (stored in Azure Blob Storage) in a new tab
async function viewProof(id) {
  try {
    const { data } = await api.get(`/requests/${id}/proof`, { responseType: 'blob' });
    window.open(URL.createObjectURL(data), '_blank');
  } catch {
    alert('No proof photo was uploaded for this request.');
  }
}

export default function RequestCard({ request, children }) {
  return (
    <div className="card">
      <div className="row">
        <b style={{ fontSize: 20 }}>#{request.id} {request.type.toUpperCase()}</b>
        <span>
          <span className={`chip ${request.urgency}`}>{request.urgency}</span>{' '}
          {request.status && <span className={`chip ${request.status}`}>{request.status}</span>}
        </span>
      </div>
      <span className="muted">Location: {request.location}</span>
      <span className="body">{request.description}</span>
      {request.volunteer && <span className="muted">Volunteer: {request.volunteer}</span>}
      {request.status === 'DELIVERED' && (
        <button className="btn o" style={{ alignSelf: 'flex-start' }} onClick={() => viewProof(request.id)}>
          View proof photo
        </button>
      )}
      {children}
    </div>
  );
}
