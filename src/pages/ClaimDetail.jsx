import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ChevronRight, ChevronDown, XCircle, CheckCircle, AlertCircle,
  FileText, Download, Award
} from 'lucide-react';
import { formatCurrency, formatDate, ensureLineItems } from '../utils/formatting';

export function ClaimDetail() {
  const { claimId } = useParams();
  const { claims, policies } = useApp();
  const navigate = useNavigate();

  const [expandedLine, setExpandedLine] = useState(null);

  const claim = useMemo(() => {
    const foundClaim = claims.find(c => c.id === claimId);
    return ensureLineItems(foundClaim);
  }, [claims, claimId]);

  if (!claim) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Claim Not Found</h2>
          <p className="text-gray-600 mb-4">The claim you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/claims')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Claims
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
      denied: { bg: 'bg-red-100', text: 'text-red-700', label: 'Denied' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      appealed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Appealed' }
    };

    const style = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  // Timeline steps
  const timeline = [
    {
      label: 'Submitted',
      date: formatDate(claim.submittedDate || claim.dateOfService),
      completed: true,
      icon: FileText
    },
    {
      label: 'Processed',
      date: formatDate(claim.processedDate || claim.dateOfService),
      completed: true,
      icon: CheckCircle
    },
    {
      label: claim.status === 'denied' ? 'Denied' : claim.status === 'approved' ? 'Approved' : 'Pending',
      date: claim.statusDate ? formatDate(claim.statusDate) : '',
      completed: claim.status !== 'pending',
      icon: claim.status === 'denied' ? XCircle : claim.status === 'approved' ? CheckCircle : AlertCircle
    }
  ];

  if (claim.appealStatus) {
    timeline.push({
      label: 'Appealed',
      date: claim.appealDate ? formatDate(claim.appealDate) : '',
      completed: true,
      icon: AlertCircle
    });
  }

  const relatedClaims = useMemo(() => {
    return claims
      .filter(c => c.id !== claim.id && (
        c.patientName === claim.patientName ||
        c.procedureCode === claim.procedureCode
      ))
      .slice(0, 5);
  }, [claims, claim]);

  const getPolicyName = (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    return policy ? policy.name : policyId;
  };

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">{claim.id}</h1>
              <div className="text-sm text-gray-600">
                Patient: {claim.patientName} • DOB: {claim.patientDOB || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">
                Provider: {claim.providerName || 'N/A'} • DOS: {formatDate(claim.dateOfService)}
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(claim.status)}
              <div className="text-sm text-gray-600 mt-2">
                Billed: <span className="font-semibold">{formatCurrency(claim.billedAmount)}</span>
              </div>
              <div className="text-sm text-gray-600">
                Paid: <span className="font-semibold">{formatCurrency(claim.paidAmount || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between relative max-w-4xl mx-auto">
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200"></div>

            {/* Timeline steps */}
            {timeline.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="mt-2 text-xs font-medium text-gray-900 text-center">{step.label}</div>
                  <div className="text-xs text-gray-500 text-center">{step.date}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-8 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Line</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Procedure Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Modifier</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700">Diagnosis Codes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Units</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Billed</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700">Paid</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {claim.lineItems?.map((item) => (
                  <React.Fragment key={item.lineNumber}>
                    {/* Main row */}
                    <tr
                      onClick={() => setExpandedLine(expandedLine === item.lineNumber ? null : item.lineNumber)}
                      className="border-t cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {expandedLine === item.lineNumber ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.lineNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-900">{item.procedureCode}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.modifiers?.join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.diagnosisCodes?.join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">{item.units || 1}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(item.billedAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(item.paidAmount || 0)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(item.status || claim.status)}
                      </td>
                    </tr>

                    {/* Expanded content */}
                    {expandedLine === item.lineNumber && (
                      <tr className="bg-gray-50 border-t">
                        <td colSpan="9" className="px-4 py-4">
                          <div className="space-y-3 ml-8">
                            {/* Edits Fired */}
                            {item.editsFired && item.editsFired.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Edits Fired</h4>
                                <div className="space-y-1">
                                  {item.editsFired.map((edit, idx) => (
                                    <div key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                      {edit}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Policies Triggered */}
                            {item.policiesTriggered && item.policiesTriggered.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Policies Triggered</h4>
                                <div className="space-y-1">
                                  {item.policiesTriggered.map((policyId) => (
                                    <button
                                      key={policyId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/policies?selected=${policyId}`);
                                      }}
                                      className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                      {getPolicyName(policyId)}
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Denial Information */}
        {claim.status === 'denied' && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Denial Information</h3>

              {/* Primary Denial Reason */}
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Primary Denial Reason</div>
                <div className="text-base font-semibold text-red-900">{claim.denialReason}</div>
              </div>

              {/* Policy Reference */}
              {(claim.policyId || (claim.policyIds && claim.policyIds.length > 0)) && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Policy Reference</div>
                  <button
                    onClick={() => navigate(`/policies?selected=${claim.policyId || claim.policyIds[0]}`)}
                    className="text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {getPolicyName(claim.policyId || claim.policyIds[0])}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* AI Insight */}
              {claim.aiInsight && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Insight</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        This claim was denied because {claim.aiInsight.explanation}
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="text-xs font-semibold text-gray-900 mb-1">To fix this:</div>
                        <p className="text-sm text-gray-700">{claim.aiInsight.guidance}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions Panel (Right Sidebar) */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

        {/* Primary CTA */}
        <button
          onClick={() => navigate(`/claim-lab?claim=${claim.id}`)}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Test in Claim Lab
        </button>

        {/* Secondary Actions */}
        {claim.appealStatus && (
          <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            View Appeal History
          </button>
        )}

        <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download EOB
          </div>
        </button>

        <button className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Export Details
        </button>

        {/* Related Claims */}
        {relatedClaims.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Related Claims</h4>
            <div className="space-y-2">
              {relatedClaims.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/claims/${related.id}`)}
                  className="w-full text-left p-2 border border-gray-200 rounded hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="text-xs text-gray-500 font-mono">{related.id}</div>
                  <div className="text-sm text-gray-900">{related.patientName}</div>
                  <div className="text-xs text-gray-600">{formatDate(related.dateOfService)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
