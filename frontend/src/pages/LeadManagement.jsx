import React, { useState, useEffect } from 'react';
import { 
  getLeads, 
  createLead, 
  updateLead, 
  deleteLead, 
  createNote, 
  deleteNote, 
  importLeadsCSV, 
  getExcelExportUrl 
} from '../services/api';

export default function LeadManagement() {
  // Lists and stats states
  const [leads, setLeads] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [ordering, setOrdering] = useState('-created_date');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Active inputs / trigger states for debouncing search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal / details trigger states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null); // null means adding a new lead
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSource, setFormSource] = useState('organic');
  const [formStatus, setFormStatus] = useState('new');
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Notes Modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [activeLeadForNotes, setActiveLeadForNotes] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // CSV Import Modal state
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvFile, setCSVFile] = useState(null);
  const [csvImportResult, setCSVImportResult] = useState(null);
  const [csvSubmitting, setCSVSubmitting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Load leads when filters/page changes
  useEffect(() => {
    fetchLeadsList();
  }, [debouncedSearch, source, status, ordering, page]);

  const fetchLeadsList = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        q: debouncedSearch,
        source: source || undefined,
        status: status || undefined,
        ordering: ordering || undefined,
        page: page
      };
      const data = await getLeads(params);
      setLeads(data.results);
      setCount(data.count);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch leads from API. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // Form field validations
  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) {
      errors.name = "Name is required.";
    }
    
    if (!formEmail.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!formPhone.trim()) {
      errors.phone_number = "Phone number is required.";
    } else if (!phoneRegex.test(formPhone.replace(/\s+/g, ''))) {
      errors.phone_number = "Phone number must be digits between 7 and 15 characters (e.g. +123456789).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (lead = null) => {
    setFormErrors({});
    if (lead) {
      // Editing
      setEditingLead(lead);
      setFormName(lead.name);
      setFormEmail(lead.email);
      setFormPhone(lead.phone_number);
      setFormSource(lead.lead_source);
      setFormStatus(lead.lead_status);
    } else {
      // Adding
      setEditingLead(null);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormSource('organic');
      setFormStatus('new');
    }
    setShowFormModal(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);
    const payload = {
      name: formName,
      email: formEmail,
      phone_number: formPhone,
      lead_source: formSource,
      lead_status: formStatus
    };

    try {
      if (editingLead) {
        await updateLead(editingLead.id, payload);
      } else {
        await createLead(payload);
      }
      setShowFormModal(false);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        // Field specific errors from serializer
        setFormErrors(err.response.data);
      } else {
        setFormErrors({ non_field: "An unexpected error occurred. Please try again." });
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteLead = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete lead: ${name}?`)) {
      try {
        await deleteLead(id);
        fetchLeadsList();
      } catch (err) {
        console.error(err);
        alert("Failed to delete lead. Please try again.");
      }
    }
  };

  const handleOpenNotes = (lead) => {
    setActiveLeadForNotes(lead);
    setNewNoteContent('');
    setShowNotesModal(true);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setNoteSubmitting(true);
    try {
      const note = await createNote(activeLeadForNotes.id, newNoteContent);
      
      // Update local state for notes
      const updatedNotes = [note, ...(activeLeadForNotes.notes || [])];
      const updatedLead = { ...activeLeadForNotes, notes: updatedNotes };
      
      setActiveLeadForNotes(updatedLead);
      setNewNoteContent('');
      
      // Update leads list notes count
      setLeads(leads.map(l => l.id === activeLeadForNotes.id ? updatedLead : l));
    } catch (err) {
      console.error(err);
      alert("Failed to create note.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(noteId);
        const updatedNotes = activeLeadForNotes.notes.filter(n => n.id !== noteId);
        const updatedLead = { ...activeLeadForNotes, notes: updatedNotes };
        setActiveLeadForNotes(updatedLead);
        setLeads(leads.map(l => l.id === activeLeadForNotes.id ? updatedLead : l));
      } catch (err) {
        console.error(err);
        alert("Failed to delete note.");
      }
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setCSVSubmitting(true);
    setCSVImportResult(null);
    try {
      const res = await importLeadsCSV(csvFile);
      setCSVImportResult(res);
      fetchLeadsList();
    } catch (err) {
      console.error(err);
      setCSVImportResult({
        success_count: 0,
        errors: ["Failed to upload or parse CSV. Check file format."]
      });
    } finally {
      setCSVSubmitting(false);
    }
  };

  // Helper for excel download
  const handleExportExcel = () => {
    const params = {
      q: debouncedSearch,
      source: source || undefined,
      status: status || undefined,
      ordering: ordering || undefined
    };
    window.location.href = getExcelExportUrl(params);
  };

  // Toggle sorting by header clicks
  const toggleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else {
      setOrdering(field);
    }
    setPage(1);
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="container-fluid py-4 animate-fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-0">Leads Directory</h2>
          <p className="text-secondary small">Add, manage, search and filter your customer leads database</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => setShowCSVModal(true)} className="btn btn-outline-success btn-sm rounded-3 px-3">
            <i className="bi bi-file-earmark-excel me-1"></i> Import CSV
          </button>
          <button onClick={handleExportExcel} className="btn btn-outline-primary btn-sm rounded-3 px-3">
            <i className="bi bi-download me-1"></i> Export Excel
          </button>
          <button onClick={() => handleOpenForm()} className="btn btn-primary btn-sm rounded-3 px-3">
            <i className="bi bi-plus-lg me-1"></i> Add Lead
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="card glass-card border-0 mb-4 p-3 shadow-sm">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent border-end-0 text-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search by name, email, phone..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
          
          <div className="col-6 col-md-2">
            <select 
              className="form-select form-select-sm text-capitalize" 
              value={source} 
              onChange={e => { setSource(e.target.value); setPage(1); }}
            >
              <option value="">All Sources</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google</option>
              <option value="organic">Organic</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select 
              className="form-select form-select-sm text-capitalize" 
              value={status} 
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <select 
              className="form-select form-select-sm" 
              value={ordering} 
              onChange={e => { setOrdering(e.target.value); setPage(1); }}
            >
              <option value="-created_date">Created Date (Newest First)</option>
              <option value="created_date">Created Date (Oldest First)</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="lead_status">Status (Ascending)</option>
              <option value="-lead_status">Status (Descending)</option>
            </select>
          </div>
          
          <div className="col-12 col-md-1">
            <button 
              className="btn btn-outline-secondary btn-sm w-100" 
              onClick={() => { setSearch(''); setSource(''); setStatus(''); setOrdering('-created_date'); setPage(1); }}
              title="Reset Filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="card glass-card border-0 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
            <span className="text-secondary small">Refreshing leads directory...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-folder-x fs-1 text-secondary"></i>
            <h5 className="mt-3 fw-bold">No leads found</h5>
            <p className="text-secondary small px-3">Try adjusting your filters or add a new lead manually.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                    Name {ordering.includes('name') && (ordering.startsWith('-') ? '↓' : '↑')}
                  </th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Source</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_date')}>
                    Created {ordering.includes('created_date') && (ordering.startsWith('-') ? '↓' : '↑')}
                  </th>
                  <th scope="col" className="text-end px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div className="fw-semibold text-body">{lead.name}</div>
                    </td>
                    <td className="text-secondary small">{lead.email}</td>
                    <td className="text-secondary small">{lead.phone_number}</td>
                    <td>
                      <span className="text-capitalize small fw-medium">
                        {lead.lead_source === 'facebook' && <i className="bi bi-facebook text-primary me-1"></i>}
                        {lead.lead_source === 'google' && <i className="bi bi-google text-danger me-1"></i>}
                        {lead.lead_source === 'organic' && <i className="bi bi-globe2 text-success me-1"></i>}
                        {lead.lead_source}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${lead.lead_status} text-capitalize`}>
                        {lead.lead_status}
                      </span>
                    </td>
                    <td className="text-secondary small">
                      {new Date(lead.created_date).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="text-end px-4">
                      <div className="d-flex justify-content-end gap-1">
                        <button 
                          onClick={() => handleOpenNotes(lead)} 
                          className="btn btn-sm btn-outline-info rounded-circle p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px' }}
                          title="Notes/Comments"
                        >
                          <i className="bi bi-journal-text small"></i>
                          {lead.notes?.length > 0 && (
                            <span className="position-absolute translate-middle badge rounded-pill bg-danger border border-white text-xxs" style={{ fontSize: '7px', margin: '-10px -10px 0 0' }}>
                              {lead.notes.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleOpenForm(lead)} 
                          className="btn btn-sm btn-outline-warning rounded-circle p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px' }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square small"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id, lead.name)} 
                          className="btn btn-sm btn-outline-danger rounded-circle p-1 d-flex align-items-center justify-content-center"
                          style={{ width: '28px', height: '28px' }}
                          title="Delete"
                        >
                          <i className="bi bi-trash-fill small"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="text-secondary small">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({count} total leads)
          </div>
          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(page - 1)}>Previous</button>
              </li>
              {[...Array(totalPages).keys()].map(p => (
                <li key={p + 1} className={`page-item ${page === p + 1 ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p + 1)}>{p + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPage(page + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Lead Create/Edit Modal */}
      {showFormModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card p-2 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingLead ? "Edit Customer Lead" : "Create New Lead"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLead}>
                <div className="modal-body py-3">
                  {formErrors.non_field && (
                    <div className="alert alert-danger py-2">{formErrors.non_field}</div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="lead-name" className="form-label small fw-semibold">Name</label>
                    <input 
                      type="text" 
                      id="lead-name"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      required 
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lead-email" className="form-label small fw-semibold">Email Address</label>
                    <input 
                      type="email" 
                      id="lead-email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      required 
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lead-phone" className="form-label small fw-semibold">Phone Number</label>
                    <input 
                      type="text" 
                      id="lead-phone"
                      className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="+123456789"
                      required 
                    />
                    {formErrors.phone_number && <div className="invalid-feedback">{formErrors.phone_number}</div>}
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label htmlFor="lead-source" className="form-label small fw-semibold">Source</label>
                        <select 
                          id="lead-source"
                          className="form-select"
                          value={formSource}
                          onChange={e => setFormSource(e.target.value)}
                        >
                          <option value="facebook">Facebook</option>
                          <option value="google">Google</option>
                          <option value="organic">Organic</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-6">
                      <div className="mb-3">
                        <label htmlFor="lead-status" className="form-label small fw-semibold">Status</label>
                        <select 
                          id="lead-status"
                          className="form-select text-capitalize"
                          value={formStatus}
                          onChange={e => setFormStatus(e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm px-3" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 fw-semibold" disabled={formSubmitting}>
                    {formSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : "Save Lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notes Detail Modal */}
      {showNotesModal && activeLeadForNotes && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card p-2 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Notes for {activeLeadForNotes.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowNotesModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                
                {/* Notes list */}
                <div className="notes-list overflow-y-auto mb-3 px-1" style={{ maxHeight: '240px' }}>
                  {!activeLeadForNotes.notes || activeLeadForNotes.notes.length === 0 ? (
                    <p className="text-secondary text-center py-4 small">No notes created yet for this lead.</p>
                  ) : (
                    activeLeadForNotes.notes.map(note => (
                      <div key={note.id} className="p-2 mb-2 rounded bg-body-tertiary border d-flex justify-content-between align-items-start">
                        <div style={{ flex: 1 }}>
                          <p className="small mb-1 text-break">{note.content}</p>
                          <span className="text-xxs text-secondary" style={{ fontSize: '10px' }}>
                            {new Date(note.created_date).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)} 
                          className="btn btn-link text-danger p-0 ms-2"
                          title="Delete note"
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote}>
                  <div className="mb-2">
                    <label htmlFor="new-note" className="form-label small fw-semibold">Add Follow-up Note</label>
                    <textarea 
                      id="new-note"
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Type details about conversations, calls, or demos..."
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button type="submit" className="btn btn-primary btn-sm px-3 fw-semibold" disabled={noteSubmitting}>
                      {noteSubmitting ? "Adding..." : "Add Note"}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card p-2 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Import Leads from CSV</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCSVModal(false); setCSVImportResult(null); setCSVFile(null); }}></button>
              </div>
              <form onSubmit={handleImportCSV}>
                <div className="modal-body py-3">
                  <p className="small text-secondary mb-3">
                    Upload a CSV file containing leads. The CSV should have headers: <strong>Name, Email, Phone Number, Source, Status</strong>. (Source & Status are optional and fallback to 'organic' and 'new').
                  </p>
                  
                  <div className="mb-3">
                    <input 
                      type="file" 
                      className="form-control form-control-sm"
                      accept=".csv"
                      onChange={e => setCSVFile(e.target.files[0])}
                      required
                    />
                  </div>

                  {csvImportResult && (
                    <div className="mt-3 border p-3 rounded bg-body-tertiary">
                      <h6 className="fw-bold text-success mb-2">
                        Successfully imported {csvImportResult.success_count} leads!
                      </h6>
                      {csvImportResult.errors && csvImportResult.errors.length > 0 && (
                        <div>
                          <div className="small fw-semibold text-danger mb-1">
                            Errors encountered ({csvImportResult.errors.length}):
                          </div>
                          <div className="overflow-y-auto px-1" style={{ maxHeight: '120px' }}>
                            <ul className="list-unstyled mb-0">
                              {csvImportResult.errors.map((err, i) => (
                                <li key={i} className="text-xxs text-danger mb-1" style={{ fontSize: '11px' }}>
                                  • {err}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="modal-footer border-0 pt-0">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm px-3" 
                    onClick={() => { setShowCSVModal(false); setCSVImportResult(null); setCSVFile(null); }}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4 fw-semibold" disabled={csvSubmitting || !csvFile}>
                    {csvSubmitting ? "Importing..." : "Upload & Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
