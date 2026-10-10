import { Resource } from '../models/Resource.js';
import { Schedule } from '../models/Schedule.js';
import { AvailabilityService } from '../services/availabilityService.js';

export class ResourceController {
  /**
   * GET /api/resources
   */
  static async getResources(req, res, next) {
    try {
      const { search, category, status, minAvailability } = req.query;
      const resources = await AvailabilityService.listResources({
        search,
        category,
        status,
        minAvailability,
      });

      // Enrich with schedules
      const resourceIds = resources.map((r) => r.resourceId);
      const schedules = await Schedule.find({ resourceId: { $in: resourceIds } });

      const scheduleMap = new Map();
      schedules.forEach((sch) => {
        scheduleMap.set(sch.resourceId, sch);
      });

      const enriched = resources.map((r) => ({
        ...r.toObject(),
        schedule: scheduleMap.get(r.resourceId) || null,
      }));

      res.status(200).json({
        success: true,
        count: enriched.length,
        resources: enriched,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resources/:id
   */
  static async getResourceById(req, res, next) {
    try {
      const { id } = req.params;
      const resource = await AvailabilityService.getResourceById(id);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `Resource with identifier '${id}' not found`,
        });
      }

      const schedule = await Schedule.findOne({ resourceId: resource.resourceId });

      res.status(200).json({
        success: true,
        resource: {
          ...resource.toObject(),
          schedule: schedule || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/resources/:id/rate
   * Admin-only utility to update rate (used to verify BR3 & T12)
   */
  static async updateResourceRate(req, res, next) {
    try {
      const { id } = req.params;
      const { rate } = req.body;

      if (rate === undefined || typeof rate !== 'number' || rate < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid non-negative rate number is required',
        });
      }

      const resource = await Resource.findOneAndUpdate(
        { resourceId: id.toUpperCase() },
        { rate },
        { new: true }
      );

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `Resource '${id}' not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: `Resource '${id}' rate updated to ₹${rate}`,
        resource,
      });
    } catch (error) {
      next(error);
    }
  }
}
