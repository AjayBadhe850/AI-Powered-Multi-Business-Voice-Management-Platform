import * as reportService from '../services/report.service.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getConsolidatedDashboard = async (req, res, next) => {
  try {
    const { timeframe } = req.query;
    const dashboard = await reportService.getConsolidatedDashboard(req.user.id, timeframe);
    return successResponse(res, dashboard, 'Consolidated dashboard data retrieved');
  } catch (err) {
    next(err);
  }
};

export const getBusinessReport = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { timeframe } = req.query;
    const report = await reportService.getBusinessReport(businessId, timeframe);
    return successResponse(res, report, 'Business report retrieved');
  } catch (err) {
    next(err);
  }
};

