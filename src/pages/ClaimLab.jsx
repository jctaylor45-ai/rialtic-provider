import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  XCircle, CheckCircle, AlertCircle, BookOpen, X, Award
} from 'lucide-react';
import { formatCurrency, ensureLineItems } from '../utils/formatting';

export function ClaimLab() {
  const { claims, policies, setLearningMarkers } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Get context (from URL params or location state)
  const contextClaim = searchParams.get('claim');
  const contextPolicy = searchParams.get('policy');
  const contextInsight = searchParams.get('insight');

  // Find the claim to work with
  const originalClaim = useMemo(() => {
    let foundClaim;
    if (contextClaim) {
      foundClaim = claims.find(c => c.id === contextClaim);
    } else {
      // Default to first denied claim if no context
      foundClaim = claims.find(c => c.status === 'denied') || claims[0];
    }
    return ensureLineItems(foundClaim);
  }, [claims, contextClaim]);

  // State
  const [editedClaim, setEditedClaim] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [simulationRun, setSimulationRun] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveTag, setSaveTag] = useState('Coding Error');

  // Initialize edited claim
  useEffect(() => {
    if (originalClaim && !editedClaim) {
      setEditedClaim(JSON.parse(JSON.stringify(originalClaim)));
    }
  }, [originalClaim]);

  // Check if there are changes - MUST be before any conditional returns
  const hasChanges = useMemo(() => {
    if (!originalClaim || !editedClaim) return false;
    return JSON.stringify(originalClaim) !== JSON.stringify(editedClaim);
  }, [originalClaim, editedClaim]);

  // AI suggestions based on denial reason - MUST be before any conditional returns
  const aiSuggestions = useMemo(() => {
    const suggestions = [];
    if (!originalClaim || !originalClaim.denialReason) return suggestions;

    if (originalClaim.denialReason?.includes('Modifier 25')) {
      suggestions.push('Add modifier 25 to the E&M code to indicate a separately identifiable service');
      suggestions.push('Ensure documentation supports the E&M service being distinct from the procedure');
    }
    if (originalClaim.denialReason?.includes('Duplicate')) {
      suggestions.push('Add modifier 91 if this is a repeat laboratory test');
      suggestions.push('Verify this is not actually a duplicate claim');
    }
    if (suggestions.length === 0) {
      suggestions.push('Review the denial reason and policy requirements');
      suggestions.push('Check for missing or incorrect codes');
    }
    return suggestions;
  }, [originalClaim]);

  // Related claims - MUST be before any conditional returns
  const relatedClaims = useMemo(() => {
    if (!originalClaim) return [];
    return claims
      .filter(c => c.id !== originalClaim.id && (
        c.patientName === originalClaim.patientName ||
        (c.procedureCodes && originalClaim.procedureCodes &&
         c.procedureCodes.some(code => originalClaim.procedureCodes.includes(code)))
      ))
      .slice(0, 5);
  }, [claims, originalClaim]);

  // Static data - MUST be before any conditional returns
  const referenceDocs = [
    { title: 'NCCI Policy Manual', source: 'CMS' },
    { title: 'Modifier Usage Guidelines', source: 'AMA' }
  ];

  const similarClaims = [];

  if (!originalClaim || !editedClaim) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Claim Selected</h2>
          <p className="text-gray-600 mb-4">Please select a claim to test in the lab.</p>
          <button
            onClick={() => navigate('/claims')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go to Claims
          </button>
        </div>
      </div>
    );
  }

  // Get changes summary
  const getChangesSummary = () => {
    const changes = [];

    if (!editedClaim.lineItems || !originalClaim.lineItems) return changes;

    editedClaim.lineItems.forEach((item, idx) => {
      const original = originalClaim.lineItems[idx];
      if (!original) return;

      if (item.procedureCode !== original.procedureCode) {
        changes.push(`Line ${item.lineNumber}: Changed procedure code to ${item.procedureCode}`);
      }
      if (JSON.stringify(item.modifiers) !== JSON.stringify(original.modifiers)) {
        changes.push(`Line ${item.lineNumber}: Updated modifiers to ${item.modifiers.join(', ')}`);
      }
      if (JSON.stringify(item.diagnosisCodes) !== JSON.stringify(original.diagnosisCodes)) {
        changes.push(`Line ${item.lineNumber}: Updated diagnosis codes`);
      }
      if (item.units !== original.units) {
        changes.push(`Line ${item.lineNumber}: Changed units to ${item.units}`);
      }
      if (item.dateOfService !== original.dateOfService) {
        changes.push(`Line ${item.lineNumber}: Updated date of service`);
      }
    });

    return changes;
  };

  // Update line item
  const updateLineItem = (lineIdx, field, value) => {
    const newClaim = { ...editedClaim };
    if (!newClaim.lineItems) return;

    if (field === 'modifiers' || field === 'diagnosisCodes') {
      newClaim.lineItems[lineIdx][field] = Array.isArray(value) ? value : value.split(',').map(v => v.trim()).filter(Boolean);
    } else {
      newClaim.lineItems[lineIdx][field] = value;
    }

    setEditedClaim(newClaim);
    setSimulationRun(false);
  };

  // Reset to original
  const resetToOriginal = () => {
    setEditedClaim(JSON.parse(JSON.stringify(originalClaim)));
    setSimulationRun(false);
    setSimulationResults(null);
  };

  // Run simulation (simplified logic)
  const runSimulation = () => {
    const results = {
      outcome: 'denied',
      editsPassed: [],
      editsFailed: [],
      newEdits: [],
      policies: [],
      estimatedAllowed: 0,
      estimatedPayment: 0
    };

    // Simple logic: Check if modifier 25 was added
    const hasModifier25 = editedClaim.lineItems?.some(item =>
      item.modifiers?.includes('25') && !originalClaim.lineItems?.find(orig =>
        orig.lineNumber === item.lineNumber
      )?.modifiers?.includes('25')
    );

    if (hasModifier25) {
      results.outcome = 'approved';
      results.editsPassed = ['Modifier 25 requirement met', 'E&M with procedure properly coded'];
      results.editsFailed = [];
      results.estimatedAllowed = parseFloat(editedClaim.billedAmount);
      results.estimatedPayment = parseFloat(editedClaim.billedAmount);
      results.policies = [
        { name: 'E&M with Procedure - Modifier 25', triggered: false }
      ];
    } else {
      results.outcome = 'denied';
      results.editsFailed = ['Missing modifier 25', 'E&M with procedure same day'];
      results.editsPassed = [];
      results.estimatedPayment = 0;
      results.estimatedAllowed = 0;
      results.policies = [
        { name: 'E&M with Procedure - Modifier 25', triggered: true }
      ];
    }

    // Check for other common issues
    editedClaim.lineItems?.forEach((item, idx) => {
      const original = originalClaim.lineItems?.[idx];
      if (!original) return;

      // Check for duplicate codes
      const duplicates = editedClaim.lineItems.filter(i => i.procedureCode === item.procedureCode);
      if (duplicates.length > 1 && !item.modifiers?.includes('91')) {
        if (!results.editsFailed.includes('Duplicate service without modifier 91')) {
          results.editsFailed.push('Duplicate service without modifier 91');
        }
        results.outcome = 'denied';
      }

      // Check for invalid diagnosis codes
      if (item.diagnosisCodes?.length === 0) {
        if (!results.editsFailed.includes('Missing diagnosis codes')) {
          results.editsFailed.push('Missing diagnosis codes');
        }
        results.outcome = 'denied';
      }
    });

    setSimulationResults(results);
    setSimulationRun(true);
  };

  // Save learning marker
  const saveLearningMarker = () => {
    const learningMarker = {
      id: `LM-${Date.now()}`,
      claimId: originalClaim.id,
      providerId: originalClaim.providerId || 'PRV-001',
      policyId: originalClaim.policyId || contextPolicy || 'POL-001',
      insightId: contextInsight,
      testDate: new Date().toISOString(),
      originalClaim: originalClaim,
      correctedClaim: editedClaim,
      changes: getChangesSummary(),
      notes: saveNotes,
      category: saveTag,
      simulationResult: simulationResults ? {
        outcome: simulationResults.outcome,
        editsPassed: simulationResults.editsPassed.length,
        editsFailed: simulationResults.editsFailed.length,
        estimatedPayment: simulationResults.estimatedPayment
      } : null
    };

    // Save to context
    setLearningMarkers(prev => [...prev, learningMarker]);

    // Show success and navigate
    setSaveDialogOpen(false);
    alert('Test saved! This will help track your learning progress.');
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Original Claim (30%) */}
      <div className="w-[30%] bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Original Submission</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Claim ID: {originalClaim.id}</div>
            <div>Patient: {originalClaim.patientName}</div>
            <div>DOS: {originalClaim.dateOfService}</div>
            <div>Provider: {originalClaim.providerName || 'N/A'}</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-900">Denied</span>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-xs text-red-900">{originalClaim.denialReason}</div>
          </div>
        </div>

        {/* Line Items (read-only) */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Line Items</h4>
          <div className="space-y-3">
            {originalClaim.lineItems?.map((item) => (
              <div key={item.lineNumber} className="bg-white border border-gray-200 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">Line {item.lineNumber}</div>
                <div className="font-mono text-sm text-gray-900 mb-1">{item.procedureCode}</div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="text-xs text-gray-600">Modifiers: {item.modifiers.join(', ')}</div>
                )}
                <div className="text-xs text-gray-600">Dx: {item.diagnosisCodes?.join(', ') || 'N/A'}</div>
                <div className="text-xs text-gray-600">Units: {item.units || 1}</div>
                <div className="text-xs font-semibold text-gray-900 mt-2">${item.billedAmount}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Edits/Policies Fired */}
        {originalClaim.lineItems?.some(item => item.editsFired?.length > 0) && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Edits Fired</h4>
            <div className="space-y-2">
              {originalClaim.lineItems.flatMap(item => item.editsFired || []).map((edit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{edit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {originalClaim.lineItems?.some(item => item.policiesTriggered?.length > 0) && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Policies Triggered</h4>
            <div className="space-y-2">
              {originalClaim.lineItems.flatMap(item => item.policiesTriggered || []).map((policyId, idx) => (
                <button
                  key={idx}
                  onClick={() => window.open(`/policies?selected=${policyId}`, '_blank')}
                  className="w-full text-left text-xs text-indigo-600 hover:underline"
                >
                  {policies.find(p => p.id === policyId)?.name || policyId}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Center Panel: Edit Workspace (40%) */}
      <div className="w-[40%] bg-white p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Corrections</h3>

        {/* Line Items (editable) */}
        <div className="space-y-6">
          {editedClaim.lineItems?.map((item, idx) => {
            const original = originalClaim.lineItems?.[idx];
            return (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-gray-900 mb-4">Line {item.lineNumber}</div>

                {/* Procedure Code */}
                <div className="mb-4">
                  <label className="text-xs text-gray-600 mb-1 block">Procedure Code</label>
                  <input
                    type="text"
                    value={item.procedureCode || ''}
                    onChange={(e) => updateLineItem(idx, 'procedureCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded font-mono text-sm ${
                      item.procedureCode !== original?.procedureCode
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Modifiers */}
                <div className="mb-4">
                  <label className="text-xs text-gray-600 mb-1 block">Modifiers</label>
                  <input
                    type="text"
                    value={item.modifiers?.join(', ') || ''}
                    onChange={(e) => updateLineItem(idx, 'modifiers', e.target.value)}
                    placeholder="25, 59, etc."
                    className={`w-full px-3 py-2 border rounded font-mono text-sm ${
                      JSON.stringify(item.modifiers) !== JSON.stringify(original?.modifiers)
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Diagnosis Codes */}
                <div className="mb-4">
                  <label className="text-xs text-gray-600 mb-1 block">Diagnosis Codes</label>
                  <input
                    type="text"
                    value={item.diagnosisCodes?.join(', ') || ''}
                    onChange={(e) => updateLineItem(idx, 'diagnosisCodes', e.target.value)}
                    className={`w-full px-3 py-2 border rounded font-mono text-sm ${
                      JSON.stringify(item.diagnosisCodes) !== JSON.stringify(original?.diagnosisCodes)
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Units */}
                <div className="mb-4">
                  <label className="text-xs text-gray-600 mb-1 block">Units</label>
                  <input
                    type="number"
                    value={item.units || 1}
                    onChange={(e) => updateLineItem(idx, 'units', parseInt(e.target.value) || 1)}
                    className={`w-24 px-3 py-2 border rounded text-sm ${
                      item.units !== original?.units
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>

                {/* Date of Service */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Date of Service</label>
                  <input
                    type="date"
                    value={item.dateOfService || editedClaim.dateOfService}
                    onChange={(e) => updateLineItem(idx, 'dateOfService', e.target.value)}
                    className={`px-3 py-2 border rounded text-sm ${
                      item.dateOfService !== original?.dateOfService
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={!hasChanges}
            className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Run Simulation
          </button>
          <button
            onClick={resetToOriginal}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Change Summary */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-xs font-semibold text-blue-900 mb-1">Changes Made:</div>
            <ul className="text-xs text-blue-800 space-y-1">
              {getChangesSummary().map((change, idx) => (
                <li key={idx}>• {change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Right Panel: Simulation Results (30%) */}
      <div className="w-[30%] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Simulation Results</h3>

        {!simulationRun ? (
          <div className="text-center text-gray-500 py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Make changes and run simulation to see results</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-2">BEFORE</div>
                <div className="bg-white border border-red-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-900">Denied</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{originalClaim.lineItems?.flatMap(i => i.editsFired || []).length || 0} edits fired</div>
                    <div>${originalClaim.paidAmount || 0} paid</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-2">AFTER</div>
                <div className={`bg-white border rounded p-3 ${
                  simulationResults.outcome === 'approved'
                    ? 'border-green-200'
                    : 'border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {simulationResults.outcome === 'approved' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-900">Would Approve</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-900">Still Denied</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>{simulationResults.editsFailed.length} edits fired</div>
                    <div>${simulationResults.estimatedPayment} would be paid</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edits Analysis */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Edits Analysis</h4>

              {/* Passed Edits */}
              {simulationResults.editsPassed.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-green-700 font-semibold mb-1">
                    ✅ {simulationResults.editsPassed.length} Edits Would Pass
                  </div>
                  <div className="space-y-1">
                    {simulationResults.editsPassed.map((edit, idx) => (
                      <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Edits */}
              {simulationResults.editsFailed.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-red-700 font-semibold mb-1">
                    ❌ {simulationResults.editsFailed.length} Edits Would Still Fire
                  </div>
                  <div className="space-y-1">
                    {simulationResults.editsFailed.map((edit, idx) => (
                      <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Edits */}
              {simulationResults.newEdits.length > 0 && (
                <div>
                  <div className="text-xs text-orange-700 font-semibold mb-1">
                    🆕 {simulationResults.newEdits.length} New Edits Would Fire
                  </div>
                  <div className="space-y-1">
                    {simulationResults.newEdits.map((edit, idx) => (
                      <div key={idx} className="text-xs text-gray-600 ml-4">• {edit}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Policy Impact */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Policy Impact</h4>
              <div className="space-y-2">
                {simulationResults.policies.map((policy, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{policy.name}</span>
                    {policy.triggered ? (
                      <XCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Calculation */}
            <div className="bg-white border border-gray-200 rounded p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment Estimate</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Billed Amount:</span>
                  <span className="font-semibold">${editedClaim.billedAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Allowed:</span>
                  <span className="font-semibold">${simulationResults.estimatedAllowed}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Estimated Payment:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${simulationResults.estimatedPayment}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Test Button */}
            <button
              onClick={() => setSaveDialogOpen(true)}
              className="w-full py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
            >
              💾 Save This Test
            </button>
          </div>
        )}
      </div>

      {/* Guidance Sidebar (Collapsible) */}
      {guidanceOpen && (
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Guidance</h3>
            <button onClick={() => setGuidanceOpen(false)}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {/* AI Suggestions */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">AI Suggestions</h4>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-gray-700 mb-3">
                Based on the denial reason, consider:
              </p>
              <ul className="text-sm text-gray-700 space-y-2">
                {aiSuggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reference Materials */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Reference Materials</h4>
            <div className="space-y-2">
              {referenceDocs.map((doc, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-xs text-gray-500">{doc.source}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Similar Approved Claims */}
          {similarClaims.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Similar Approved Claims</h4>
              <div className="space-y-2">
                {similarClaims.map((claim, idx) => (
                  <div key={idx} className="border border-gray-200 rounded p-2">
                    <div className="text-xs text-gray-500 font-mono mb-1">{claim.id}</div>
                    <div className="text-xs text-gray-700">{claim.codes}</div>
                    <button className="text-xs text-indigo-600 hover:underline mt-1">
                      Use as template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!guidanceOpen && (
        <button
          onClick={() => setGuidanceOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-l-lg hover:bg-indigo-700 transition-colors"
          style={{ writingMode: 'vertical-rl' }}
        >
          Guidance
        </button>
      )}

      {/* Save Test Dialog */}
      {saveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Save Test</h2>

            {/* Auto-generated summary */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Test Summary</label>
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-sm text-gray-700 space-y-1">
                  {getChangesSummary().map((change, idx) => (
                    <div key={idx}>• {change}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes field */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Notes <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={saveNotes}
                onChange={(e) => setSaveNotes(e.target.value)}
                placeholder="What did you learn from this test?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded resize-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-900 mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {['Coding Error', 'Modifier Issue', 'Documentation Problem', 'Other'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSaveTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors ${
                      saveTag === tag
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={saveLearningMarker}
                className="flex-1 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Test
              </button>
              <button
                onClick={() => setSaveDialogOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
