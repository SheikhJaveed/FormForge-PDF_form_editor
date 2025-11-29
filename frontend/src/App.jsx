import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import axios from 'axios';
import "./App.css"; 

// Initialize PDF Worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// --- HELPER FUNCTIONS ---
const genId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).substr(2, 9)}`;
};

// --- ICONS ---
const Icons = {
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>,
  AlignLeft: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>,
  AlignCenter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>,
  AlignRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>,
  Upload: () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mb-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
};

const FONT_SIZES = Array.from({ length: 20 }, (_, i) => i + 6);

// --- DRAGGABLE FIELD COMPONENT ---
const DraggableField = ({ field, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onDragStopRaw }) => {
  return (
    <Rnd
      size={{ width: field.w, height: field.h }}
      position={{ x: field.x, y: field.y }}
      onDragStop={(e, d) => onDragStopRaw(e, d, field.id)}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate(field.id, {
          w: parseInt(ref.style.width),
          h: parseInt(ref.style.height),
          ...position,
        });
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(field.id);
      }}
      className={`group m-0 p-0 ${isSelected ? 'z-50' : 'z-10'}`} 
    >
      {isSelected && (
        <div 
          className="absolute -top-20 left-0 bg-white shadow-xl border border-gray-200 rounded p-2 z-50 flex flex-col gap-2"
          style={{ width: 'max-content' }}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <div className="flex flex-col">
               <label className="text-[9px] text-gray-400 font-bold uppercase">Field Name</label>
               <input 
                 type="text" 
                 value={field.name}
                 onChange={(e) => onUpdate(field.id, { name: e.target.value })}
                 className="text-xs font-semibold text-gray-700 outline-none w-28 bg-gray-50 border border-gray-200 rounded px-1"
               />
            </div>
            <div className="flex items-center gap-1 border-l pl-2">
              <input 
                type="checkbox" 
                checked={field.required}
                onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              />
              <span className="text-xs text-gray-600">Req.</span>
            </div>
            <button onClick={() => onDuplicate(field)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Icons.Copy /></button>
            <button onClick={() => onDelete(field.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Icons.Trash /></button>
          </div>

          {field.type === 'text' && (
            <div className="flex items-center gap-2">
              <select 
                value={field.fontSize} 
                onChange={(e) => onUpdate(field.id, { fontSize: parseInt(e.target.value) })}
                className="text-xs border border-gray-300 rounded p-1"
              >
                {FONT_SIZES.map(size => <option key={size} value={size}>{size}px</option>)}
              </select>
              <div className="flex bg-gray-100 rounded p-0.5">
                {['left', 'center', 'right'].map(align => (
                  <button 
                    key={align}
                    onClick={() => onUpdate(field.id, { align })}
                    className={`p-1 rounded ${field.align === align ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {align === 'left' && <Icons.AlignLeft />}
                    {align === 'center' && <Icons.AlignCenter />}
                    {align === 'right' && <Icons.AlignRight />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div 
        className={`
          w-full h-full flex items-center px-1 cursor-move overflow-hidden
          transition-all duration-200 border
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-blue-300 border-dashed bg-blue-50 bg-opacity-30 hover:bg-opacity-50'}
          ${field.type === 'checkbox' ? 'justify-center' : ''}
        `}
      >
        {field.type === 'text' ? (
          <span 
            className="w-full text-blue-900 opacity-80 whitespace-nowrap overflow-hidden"
            style={{ 
              fontSize: `${field.fontSize}px`, 
              textAlign: field.align,
            }}
          >
            Sample Text
          </span>
        ) : (
          <div className="w-4 h-4 border border-blue-500 bg-white rounded flex items-center justify-center">
            {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>}
          </div>
        )}
      </div>
    </Rnd>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [addingMode, setAddingMode] = useState(null); 
  const pageRefs = useRef({});
  const fileInputRef = useRef(null); // Reference for hidden input

  // --- FILE HANDLING ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFields([]);
      setAddingMode(null);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFields([]);
      setAddingMode(null);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // --- EDITOR LOGIC ---
  const handlePageClick = (e, pageIndex) => {
    if (!addingMode) {
      setSelectedFieldId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const id = genId();
    const w = addingMode === 'text' ? 160 : 30;
    const h = 30;

    setFields([...fields, {
      id,
      type: addingMode,
      page: pageIndex, 
      x: x - (w / 2), 
      y: y - (h / 2), 
      w: w, 
      h: h,
      name: `field_${id.toString().slice(0, 8)}`,
      required: false,
      fontSize: 11,
      align: 'left'
    }]);

    setAddingMode(null);
    setSelectedFieldId(id);
  };

  const updateField = (id, props) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...props } : f));
  };

  const deleteField = (id) => {
    setFields(fields.filter(f => f.id !== id));
    setSelectedFieldId(null);
  };

  const duplicateField = (field) => {
    const newId = genId();
    setFields([...fields, {
      ...field,
      id: newId,
      x: field.x + 20, 
      y: field.y + 20,
      name: `${field.name}_copy`
    }]);
    setSelectedFieldId(newId);
  };

  const handleDragStop = (e, d, fieldId) => {
    const boxRect = d.node.getBoundingClientRect();
    const boxCenterY = boxRect.top + (boxRect.height / 2);

    for (let i = 0; i < numPages; i++) {
      const pageEl = pageRefs.current[i];
      if (pageEl) {
        const pageRect = pageEl.getBoundingClientRect();
        if (boxCenterY >= pageRect.top && boxCenterY <= pageRect.bottom) {
          const newX = boxRect.left - pageRect.left;
          const newY = boxRect.top - pageRect.top;
          updateField(fieldId, { page: i, x: newX, y: newY });
          break;
        }
      }
    }
  };

  const handleSave = async () => {
    if(!file) return;
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('fields', JSON.stringify(fields));

    try {
      const res = await axios.post('http://localhost:5000/process-pdf', formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'edited_form.pdf');
      document.body.appendChild(link);
      link.click();
    } catch(err) { console.error(err); }
  };

  return (
    <div className={`bg-slate-50 min-h-screen font-sans ${addingMode ? 'cursor-crosshair' : ''}`}>
      
      {/* --- GLOBAL STYLES --- */}
      <style>{`
        .react-pdf__Page { margin: 0 !important; }
        .react-pdf__Page__canvas { display: block !important; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full h-16 bg-white border-b border-gray-200 shadow-sm z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                F
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">FormForge</span>
        </div>
        
        {/* Editor Actions (Visible only when file loaded) */}
        {file && (
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setAddingMode(addingMode === 'text' ? null : 'text')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${addingMode === 'text' ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
             >
               <span className="text-lg font-serif">T</span> Text
             </button>
             
             <button 
                onClick={() => setAddingMode(addingMode === 'checkbox' ? null : 'checkbox')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${addingMode === 'checkbox' ? 'bg-green-600 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
             >
               <span>☑</span> Checkbox
             </button>

             {addingMode && (
                 <span className="text-xs text-blue-600 font-bold animate-pulse ml-2 hidden lg:block uppercase tracking-wide">
                     Click to place
                 </span>
             )}

             <div className="h-6 w-px bg-gray-300 mx-2"></div>
             
             <button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5">
               Apply Changes
             </button>
          </div>
        )}
      </nav>

      {/* --- CONTENT AREA --- */}
      <div className="pt-20 pb-10 min-h-screen flex flex-col items-center">
        
        {/* VIEW 1: UPLOAD SCREEN */}
        {!file && (
            <div className="flex-grow flex items-center justify-center w-full px-4">
                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-xl w-full text-center border border-gray-100 transition-all hover:shadow-3xl">
                    <div 
                        className="border-2 border-dashed border-blue-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-blue-50/30 transition-colors hover:bg-blue-50 hover:border-blue-400"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <Icons.Upload />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Drag and Drop files to upload</h2>
                        <p className="text-gray-400 mb-6">or</p>
                        
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange} 
                            accept="application/pdf"
                            hidden 
                        />
                        
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition-transform transform hover:scale-105 active:scale-95"
                        >
                            Browse Files
                        </button>

                        <p className="mt-6 text-sm text-gray-400 font-medium">Supported files: PDF</p>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 2: PDF EDITOR */}
        {file && (
          <div className="w-full flex justify-center p-4">
             <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className="flex flex-col gap-8">
                {Array.from(new Array(numPages), (_, i) => (
                  <div 
                    key={i} 
                    className="relative bg-white shadow-xl transition-shadow hover:shadow-2xl"
                    style={{ width: '800px' }} 
                    ref={el => pageRefs.current[i] = el}
                    onClick={(e) => handlePageClick(e, i)}
                  >
                    <Page 
                      pageNumber={i + 1} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      width={800} 
                    />
                    
                    {fields.filter(f => f.page === i).map(field => (
                      <DraggableField 
                        key={field.id}
                        field={field}
                        isSelected={selectedFieldId === field.id}
                        onSelect={setSelectedFieldId}
                        onUpdate={updateField}
                        onDelete={deleteField}
                        onDuplicate={duplicateField}
                        onDragStopRaw={handleDragStop}
                      />
                    ))}
                  </div>
                ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;