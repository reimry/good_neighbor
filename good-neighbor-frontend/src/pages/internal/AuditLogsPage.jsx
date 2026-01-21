import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    actor_id: '',
    osbb_id: '',
    action_type: '',
    entity_type: '',
    start_date: '',
    end_date: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
      const response = await api.get('/internal/audit-logs', { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError(error.response?.data?.error || 'Помилка завантаження журналу аудиту');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      actor_id: '',
      osbb_id: '',
      action_type: '',
      entity_type: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(fetchLogs, 100);
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
  };

  const formatJson = (json) => {
    if (!json) return 'N/A';
    try {
      if (typeof json === 'object') {
        return JSON.stringify(json, null, 2);
      }
      if (typeof json === 'string') {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return String(json);
    } catch (error) {
      return String(json);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">Audit Logs</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Actor ID</label>
            <input
              type="number"
              value={filters.actor_id}
              onChange={(e) => handleFilterChange('actor_id', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              placeholder="User ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">OSBB ID</label>
            <input
              type="number"
              value={filters.osbb_id}
              onChange={(e) => handleFilterChange('osbb_id', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              placeholder="OSBB ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Action Type</label>
            <input
              type="text"
              value={filters.action_type}
              onChange={(e) => handleFilterChange('action_type', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              placeholder="login_success, approve_registration..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Entity Type</label>
            <input
              type="text"
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              placeholder="user, voting, osbb_registration..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">OSBB</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {log.actor_name || `ID: ${log.actor_id || 'N/A'}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {log.osbb_name || (log.osbb_id ? `ID: ${log.osbb_id}` : 'Global')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{log.action_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewDetails(log)}
                        className="text-primary-500 hover:text-primary-600"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="text-center py-8 text-neutral-500">No logs found</div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Log Details #{selectedLog.id}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Actor:</strong> {selectedLog.actor_name || `ID: ${selectedLog.actor_id || 'N/A'}`} ({selectedLog.actor_role || 'N/A'})</div>
              <div><strong>OSBB:</strong> {selectedLog.osbb_name || (selectedLog.osbb_id ? `ID: ${selectedLog.osbb_id}` : 'Global action')}</div>
              <div><strong>Action Type:</strong> {selectedLog.action_type}</div>
              <div><strong>Entity:</strong> {selectedLog.entity_type ? `${selectedLog.entity_type} #${selectedLog.entity_id}` : 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
              {selectedLog.old_data && (
                <div>
                  <strong>Old Data:</strong>
                  <pre className="bg-neutral-50 p-3 rounded mt-1 text-xs overflow-x-auto">
                    {formatJson(selectedLog.old_data)}
                  </pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div>
                  <strong>New Data:</strong>
                  <pre className="bg-neutral-50 p-3 rounded mt-1 text-xs overflow-x-auto">
                    {formatJson(selectedLog.new_data)}
                  </pre>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <strong>Metadata:</strong>
                  <pre className="bg-neutral-50 p-3 rounded mt-1 text-xs overflow-x-auto">
                    {formatJson(selectedLog.metadata)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
