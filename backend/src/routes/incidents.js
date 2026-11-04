const express = require('express');
const router = express.Router();
const { buildChronologicalTimeline } = require('../services/timelineBuilder');
const { identifyFirstExposure } = require('../services/exposureDetector');
const { analyzeIncidentImpact } = require('../services/impactAnalyzer');
const { getServicesMap } = require('../services/lineageTracker');
const rawDbAdapter = require('../config/dbAdapter');

const dbAdapter = (rawDbAdapter && typeof rawDbAdapter.getIncidents === 'function')
  ? rawDbAdapter
  : (rawDbAdapter && rawDbAdapter.default)
    ? rawDbAdapter.default
    : rawDbAdapter;

/**
 * GET /api/incidents
 * Returns a paginated list of leakage incidents with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const status = req.query.status || '';
    const severity = req.query.severity || '';
    const search = req.query.search || '';

    const result = await dbAdapter.getIncidents({ limit, offset, status, severity, search });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error listing incidents:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INCIDENTS_LIST_FAILED' }
    });
  }
});

/**
 * GET /api/incidents/:id
 * Returns detailed record of a single incident including first exposure metadata
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await dbAdapter.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: { message: `Incident not found: ${id}`, code: 'INCIDENT_NOT_FOUND' }
      });
    }

    // Retrieve related events by incident_id or trace_id
    let events = [];
    if (incident.incident_id) {
      events = await dbAdapter.getLineageEventsByIncidentId(incident.incident_id);
    }
    if ((!events || events.length === 0) && incident.trace_id) {
      events = await dbAdapter.getLineageEventsByTraceId(incident.trace_id);
    }

    const servicesMap = await getServicesMap();
    const firstExposure = identifyFirstExposure(events, servicesMap);

    res.status(200).json({
      success: true,
      data: {
        incident,
        firstExposure,
        eventsCount: events.length
      }
    });
  } catch (err) {
    console.error('Error fetching incident:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INCIDENT_FETCH_FAILED' }
    });
  }
});

/**
 * GET /api/incidents/:id/timeline
 * Returns the chronological sequence of investigation events for this incident
 */
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await dbAdapter.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: { message: `Incident not found: ${id}`, code: 'INCIDENT_NOT_FOUND' }
      });
    }

    let events = [];
    if (incident.incident_id) {
      events = await dbAdapter.getLineageEventsByIncidentId(incident.incident_id);
    }
    if ((!events || events.length === 0) && incident.trace_id) {
      events = await dbAdapter.getLineageEventsByTraceId(incident.trace_id);
    }

    const servicesMap = await getServicesMap();
    const timelineData = buildChronologicalTimeline(events, servicesMap);
    const firstExposure = identifyFirstExposure(events, servicesMap);

    res.status(200).json({
      success: true,
      data: {
        incidentId: incident.incident_id || incident.id,
        traceId: incident.trace_id,
        title: incident.title,
        severity: incident.severity,
        firstExposure,
        ...timelineData
      }
    });
  } catch (err) {
    console.error('Error fetching incident timeline:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INCIDENT_TIMELINE_FAILED' }
    });
  }
});

/**
 * GET /api/incidents/:id/impact
 * Returns quantitative blast radius and impacted entities for this incident
 */
router.get('/:id/impact', async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await dbAdapter.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        error: { message: `Incident not found: ${id}`, code: 'INCIDENT_NOT_FOUND' }
      });
    }

    let events = [];
    if (incident.incident_id) {
      events = await dbAdapter.getLineageEventsByIncidentId(incident.incident_id);
    }
    if ((!events || events.length === 0) && incident.trace_id) {
      events = await dbAdapter.getLineageEventsByTraceId(incident.trace_id);
    }

    const servicesMap = await getServicesMap();
    const impactReport = analyzeIncidentImpact(incident, events, servicesMap);

    res.status(200).json({
      success: true,
      data: impactReport
    });
  } catch (err) {
    console.error('Error fetching incident impact:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INCIDENT_IMPACT_FAILED' }
    });
  }
});

/**
 * PATCH /api/incidents/:id/status
 * Updates the incident status (e.g. 'OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED')
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: { message: 'Status is required', code: 'INVALID_STATUS' }
      });
    }

    const updated = await dbAdapter.updateIncidentStatus(id, status.toUpperCase());
    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    console.error('Error updating incident status:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'STATUS_UPDATE_FAILED' }
    });
  }
});

module.exports = router;

