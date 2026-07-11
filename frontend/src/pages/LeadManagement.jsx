import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

// Custom Dropdown Component matching the modern popup aesthetic
function CustomSelect({ value, onChange, options, isSmall = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  useEffect(() => {
    const handleClose = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClose);
    return () => document.removeEventListener('mousedown', handleClose);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0] || { label: '', value: '' };

  return (
    <div className="custom-select-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isSmall ? 'custom-select-trigger-sm' : ''} ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-truncate">{selectedOption.label}</span>
        <i className="bi bi-chevron-expand trigger-chevron"></i>
      </button>

      {isOpen && (
        <div className="custom-select-options-container animate-fade-in">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`custom-select-option border-0 w-100 ${opt.value === value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadManagement() {
  // Lists and stats states
  const [leads, setLeads] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [source, setSource] = useState(() => localStorage.getItem('leadhub_default_source') || '');
  const [status, setStatus] = useState('');
  const [ordering, setOrdering] = useState(() => localStorage.getItem('leadhub_default_ordering') || '-created_date');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem('leadhub_default_page_size');
    return saved ? parseInt(saved, 10) : 20;
  });

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

  // Lock body scroll when any modal is open to ensure proper scroll behavior
  useEffect(() => {
    const isAnyModalOpen = showFormModal || showNotesModal || showCSVModal;
    if (isAnyModalOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [showFormModal, showNotesModal, showCSVModal]);

  const fetchLeadsList = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        q: debouncedSearch,
        source: source || undefined,
        status: status || undefined,
        ordering: ordering || undefined,
        page: page,
        page_size: pageSize
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
      fetchLeadsList();
      
      if (res.errors && res.errors.length > 0) {
        alert(`Import complete! ${res.success_count} leads successfully imported. ${res.errors.length} errors encountered.`);
      } else {
        alert(`Successfully imported ${res.success_count} leads!`);
      }
      
      setShowCSVModal(false);
      setCSVFile(null);
      setCSVImportResult(null);
    } catch (err) {
      console.error(err);
      setCSVImportResult({
        success_count: 0,
        errors: ["Failed to upload or parse CSV. Check file format."]
      });
      alert("Failed to upload or parse CSV. Please check the file format.");
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

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    items.push(1);
    
    let startPage = Math.max(2, page - 1);
    let endPage = Math.min(totalPages - 1, page + 1);
    
    if (page <= 3) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    }
    if (page >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 2);
    }
    
    if (startPage > 2) {
      items.push('ellipsis1');
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    if (endPage < totalPages - 1) {
      items.push('ellipsis2');
    }
    
    if (totalPages > 1) {
      // Always show last page
      items.push(totalPages);
    }
    
    return items.map((item, index) => {
      if (item === 'ellipsis1' || item === 'ellipsis2') {
        return (
          <li key={`ellipsis-${index}`} className="page-item disabled">
            <span className="page-link rounded-3 px-2 py-1.5 bg-transparent border-0 text-secondary">...</span>
          </li>
        );
      }
      return (
        <li key={item} className={`page-item ${page === item ? 'active' : ''}`}>
          <button 
            className={`page-link rounded-3 px-3 py-1.5 ${page === item ? 'bg-primary text-white border-0' : 'bg-transparent border text-secondary'}`} 
            onClick={() => setPage(item)}
          >
            {item}
          </button>
        </li>
      );
    });
  };

  return (
    <div className="position-relative container-fluid py-3 py-md-4 animate-fade-in">

      {/* Header section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
        <div>
          <h1 className="fw-extrabold tracking-tight mb-1" style={{ fontSize: '1.75rem' }}>Leads Directory</h1>
          <p className="text-secondary small mb-0">Manage customer interactions, channel filters, and CSV integrations.</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button onClick={() => setShowCSVModal(true)} className="btn btn-outline-primary btn-sm rounded-3 px-3 py-2 d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-arrow-up"></i>
            <span>Import CSV</span>
          </button>
          <button onClick={handleExportExcel} className="btn btn-outline-secondary btn-sm rounded-3 px-3 py-2 d-flex align-items-center gap-2">
            <i className="bi bi-download"></i>
            <span>Export Excel</span>
          </button>
          <button onClick={() => handleOpenForm()} className="btn btn-primary btn-sm rounded-3 px-3 py-2 d-flex align-items-center gap-2">
            <i className="bi bi-plus-lg"></i>
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-4 shadow-sm mb-4" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Filters Card */}
      <div className="card glass-card border-0 mb-4 p-3 shadow-sm position-relative" style={{ zIndex: 5, overflow: 'visible' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent border-end-0 text-secondary">
                <i className="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search name, email, phone..." 
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
            <CustomSelect
              isSmall
              value={source}
              onChange={val => { setSource(val); setPage(1); }}
              options={[
                { value: '', label: 'All Sources' },
                { value: 'facebook', label: 'Facebook Ads' },
                { value: 'google', label: 'Google Search' },
                { value: 'organic', label: 'Organic' }
              ]}
            />
          </div>

          <div className="col-6 col-md-2">
            <CustomSelect
              isSmall
              value={status}
              onChange={val => { setStatus(val); setPage(1); }}
              options={[
                { value: '', label: 'All Funnels' },
                { value: 'new', label: 'Incoming' },
                { value: 'contacted', label: 'In Touch' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'closed', label: 'Closed' }
              ]}
            />
          </div>

          <div className="col-12 col-md-3">
            <CustomSelect
              isSmall
              value={ordering}
              onChange={val => { setOrdering(val); setPage(1); }}
              options={[
                { value: '-created_date', label: 'Creation Date (Newest first)' },
                { value: 'created_date', label: 'Creation Date (Oldest first)' },
                { value: 'name', label: 'Name (A-Z)' },
                { value: '-name', label: 'Name (Z-A)' },
                { value: 'lead_status', label: 'Status stage (Ascending)' },
                { value: '-lead_status', label: 'Status stage (Descending)' }
              ]}
            />
          </div>
          
          <div className="col-12 col-md-1">
            <button 
              className="btn btn-outline-secondary btn-sm w-100 py-1.5" 
              onClick={() => { setSearch(''); setSource(''); setStatus(''); setOrdering('-created_date'); setPage(1); }}
              title="Reset Filters"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="overflow-hidden mb-4 position-relative" style={{ zIndex: 1 }}>
        {loading ? (
          <div className="text-center py-5 glass-card border-0">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status" style={{ borderRightColor: 'transparent' }}></div>
            <span className="text-secondary small fw-semibold">Refreshing leads directory...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-5 px-3 glass-card border-0 bg-transparent">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '60px', height: '60px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
              <i className="bi bi-folder-x fs-2"></i>
            </div>
            <h5 className="fw-bold mb-1">No Leads Found</h5>
            <p className="text-secondary small mx-auto mb-4" style={{ maxWidth: '320px' }}>
              We couldn't find any results matching your search terms or filters. Try adjusting them or add a new lead manually.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button 
                className="btn btn-sm btn-outline-secondary rounded-3 px-3 py-1.5"
                onClick={() => { setSearch(''); setSource(''); setStatus(''); setOrdering('-created_date'); setPage(1); }}
              >
                Clear Filters
              </button>
              <button 
                className="btn btn-sm btn-primary rounded-3 px-3 py-1.5 text-white"
                onClick={() => handleOpenForm()}
              >
                Add Customer Lead
              </button>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table custom-table align-middle mb-0">
              <thead className="table-borderless">
                <tr>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                    Name {ordering.includes('name') && (ordering.startsWith('-') ? ' ↓' : ' ↑')}
                  </th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Source</th>
                  <th scope="col">Status</th>
                  <th scope="col" style={{ cursor: 'pointer' }} onClick={() => toggleSort('created_date')}>
                    Created {ordering.includes('created_date') && (ordering.startsWith('-') ? ' ↓' : ' ↑')}
                  </th>
                  <th scope="col" className="text-end px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td className="fw-semibold">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '0.8rem', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-truncate" style={{ maxWidth: '140px' }} title={lead.name}>{lead.name}</div>
                      </div>
                    </td>
                    <td className="text-secondary small">
                      <div className="text-truncate" style={{ maxWidth: '160px' }} title={lead.email}>
                        {lead.email}
                      </div>
                    </td>
                    <td className="text-secondary small">
                      <div className="text-truncate" style={{ maxWidth: '120px' }} title={lead.phone_number}>
                        {lead.phone_number}
                      </div>
                    </td>
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
                    <td className="text-end px-3">
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          onClick={() => handleOpenNotes(lead)} 
                          className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center position-relative"
                          style={{ width: '34px', height: '34px' }}
                          title="Notes/Comments"
                        >
                          <i className="bi bi-chat-text small"></i>
                          {lead.notes?.length > 0 && (
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white text-xxs p-0 d-flex align-items-center justify-content-center" style={{ fontSize: '9px', minWidth: '16px', height: '16px', margin: '-3px 0 0 -3px' }}>
                              {lead.notes.length}
                            </span>
                          )}
                        </button>
                        <button 
                          onClick={() => handleOpenForm(lead)} 
                          className="btn btn-sm btn-outline-warning rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px' }}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square small"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id, lead.name)} 
                          className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                          style={{ width: '34px', height: '34px' }}
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
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mb-4 position-relative" style={{ zIndex: 1 }}>
          <div className="text-secondary small">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({count} total leads)
          </div>
          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm mb-0 gap-1">
              <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                <button className="page-link rounded-3 px-3 py-1.5 bg-transparent border text-secondary" onClick={() => setPage(page - 1)}>Previous</button>
              </li>
              {renderPaginationItems()}
              <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                <button className="page-link rounded-3 px-3 py-1.5 bg-transparent border text-secondary" onClick={() => setPage(page + 1)}>Next</button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Lead Create/Edit Modal */}
      {showFormModal && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }} onClick={() => setShowFormModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content glass-card p-3 border-0" style={{ overflow: 'visible' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingLead ? "Edit Customer Lead" : "Create New Lead"}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLead}>
                <div className="modal-body py-3">
                  {formErrors.non_field && (
                    <div className="alert alert-danger border-0 rounded-3 py-2 small" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                      {formErrors.non_field}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="lead-name" className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input 
                      type="text" 
                      id="lead-name"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="e.g. John Doe"
                      required 
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lead-email" className="form-label small fw-semibold text-secondary">Email Address</label>
                    <input 
                      type="email" 
                      id="lead-email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      required 
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lead-phone" className="form-label small fw-semibold text-secondary">Phone Number</label>
                    <input 
                      type="text" 
                      id="lead-phone"
                      className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      placeholder="e.g. +123456789"
                      required 
                    />
                    {formErrors.phone_number && <div className="invalid-feedback">{formErrors.phone_number}</div>}
                  </div>

                  <div className="row">
                    <div className="col-6">
                      <div className="mb-3">
                        <label htmlFor="lead-source" className="form-label small fw-semibold text-secondary">Lead Source</label>
                        <CustomSelect
                          value={formSource}
                          onChange={setFormSource}
                          options={[
                            { value: 'facebook', label: 'Facebook Ads' },
                            { value: 'google', label: 'Google Search' },
                            { value: 'organic', label: 'Organic' }
                          ]}
                        />
                      </div>
                    </div>
                    
                    <div className="col-6">
                      <div className="mb-3">
                        <label htmlFor="lead-status" className="form-label small fw-semibold text-secondary">Funnel Status</label>
                        <CustomSelect
                          value={formStatus}
                          onChange={setFormStatus}
                          options={[
                            { value: 'new', label: 'Incoming' },
                            { value: 'contacted', label: 'In Touch' },
                            { value: 'qualified', label: 'Qualified' },
                            { value: 'closed', label: 'Closed' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-0 pt-0 gap-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3" onClick={() => setShowFormModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 py-2 fw-semibold rounded-3 text-white" disabled={formSubmitting}>
                    {formSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : "Save Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Notes Detail Modal */}
      {showNotesModal && activeLeadForNotes && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }} onClick={() => setShowNotesModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content glass-card p-3 border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Notes for {activeLeadForNotes.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowNotesModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                
                {/* Notes list */}
                <div className="notes-list overflow-y-auto mb-4 px-1" style={{ maxHeight: '240px' }}>
                  {!activeLeadForNotes.notes || activeLeadForNotes.notes.length === 0 ? (
                    <p className="text-secondary text-center py-4 small">No notes created yet for this lead.</p>
                  ) : (
                    activeLeadForNotes.notes.map(note => (
                      <div key={note.id} className="p-3 mb-2 rounded-4 bg-body bg-opacity-25 border border-secondary border-opacity-10 d-flex justify-content-between align-items-start animate-fade-in">
                        <div style={{ flex: 1 }}>
                          <p className="small mb-1 text-break">{note.content}</p>
                          <span className="text-xxs text-secondary">
                            {new Date(note.created_date).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)} 
                          className="btn btn-link text-danger p-0 ms-2 text-decoration-none"
                          title="Delete note"
                        >
                          <i className="bi bi-x-circle-fill fs-5 opacity-75 hover-opacity-100"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add note form */}
                <form onSubmit={handleAddNote}>
                  <div className="mb-3">
                    <label htmlFor="new-note" className="form-label small fw-semibold text-secondary">Add Follow-up Note</label>
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
                    <button type="submit" className="btn btn-primary btn-sm px-4 py-2 fw-semibold rounded-3 text-white" disabled={noteSubmitting}>
                      {noteSubmitting ? "Adding..." : "Add Note"}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSV Import Modal */}
      {showCSVModal && createPortal(
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }} onClick={() => { setShowCSVModal(false); setCSVImportResult(null); setCSVFile(null); }}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content glass-card p-3 border-0">
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
                    <div className="mt-3 border border-secondary border-opacity-10 p-3 rounded-4 bg-body bg-opacity-25 animate-fade-in">
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
                
                <div className="modal-footer border-0 pt-0 gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3" 
                    onClick={() => { setShowCSVModal(false); setCSVImportResult(null); setCSVFile(null); }}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm px-4 py-2 fw-semibold rounded-3 text-white" disabled={csvSubmitting || !csvFile}>
                    {csvSubmitting ? "Importing..." : "Upload & Import"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
